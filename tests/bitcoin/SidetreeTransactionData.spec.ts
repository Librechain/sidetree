import BitcoinInputModel from '../../lib/bitcoin/models/BitcoinInputModel';
import BitcoinOutputModel from '../../lib/bitcoin/models/BitcoinOutputModel';
import BitcoinTransactionModel from '../../lib/bitcoin/models/BitcoinTransactionModel';
import SidetreeTransactionData from '../../lib/bitcoin/SidetreeTransactionData';
import { crypto } from 'bitcore-lib';

describe('SidetreeTransactionData', () => {
  let sidetreeTransactionPrefix: string;

  beforeAll(() => {
    sidetreeTransactionPrefix = 'sidetree:';
  });

  function createValidDataOutput (data: string): BitcoinOutputModel {
    const sidetreeDataWithPrefix = sidetreeTransactionPrefix + data;
    const sidetreeDataWithPrefixInHex = Buffer.from(sidetreeDataWithPrefix).toString('hex');

    return {
      satoshis: 0,
      scriptAsmAsString: `OP_RETURN ${sidetreeDataWithPrefixInHex}`
    };
  }

  function createValidWriterInput (writer: string): BitcoinInputModel {
    return {
      previousTransactionId: 'some previous txn id',
      outputIndexInPreviousTransaction: 1,
      scriptAsmAsString: `signature ${writer}`
    };
  }

  describe('parse', () => {
    it('should return undefined if the sidetree data is invalid', async (done) => {
      const mockTxn: BitcoinTransactionModel = {
        id: 'some id',
        blockHash: 'hash',
        confirmations: 1,
        outputs: [],
        inputs: []
      };

      spyOn(SidetreeTransactionData as any, 'getValidSidetreeDataFromOutputs').and.returnValue(undefined);

      const actual = SidetreeTransactionData.parse(mockTxn, sidetreeTransactionPrefix);
      expect(actual).not.toBeDefined();
      done();
    });

    it('should return undefined if the writer data is invalid', async (done) => {
      const mockTxn: BitcoinTransactionModel = {
        id: 'some id',
        blockHash: 'hash',
        confirmations: 1,
        outputs: [],
        inputs: []
      };

      spyOn(SidetreeTransactionData as any, 'getValidSidetreeDataFromOutputs').and.returnValue('some data');
      spyOn(SidetreeTransactionData as any, 'getValidWriterFromInputs').and.returnValue(undefined);

      const actual = SidetreeTransactionData.parse(mockTxn, sidetreeTransactionPrefix);
      expect(actual).not.toBeDefined();
      done();
    });

    it('should return correct expected data', async (done) => {
      const sidetreeData = 'sidetree data';
      const writer = 'valid writer';

      const mockTxn: BitcoinTransactionModel = {
        id: 'some id',
        blockHash: 'hash',
        confirmations: 1,
        outputs: [],
        inputs: []
      };

      spyOn(SidetreeTransactionData as any, 'getValidSidetreeDataFromOutputs').and.returnValue(sidetreeData);
      spyOn(SidetreeTransactionData as any, 'getValidWriterFromInputs').and.returnValue(writer);

      const actual = SidetreeTransactionData.parse(mockTxn, sidetreeTransactionPrefix);
      expect(actual).toBeDefined();
      expect(actual!.data).toEqual(sidetreeData);
      expect(actual!.writer).toEqual(writer);
      done();
    });
  });

  describe('getValidSidetreeDataFromOutputs', () => {
    it('should return the sidetree data if only output has the data present', async (done) => {
      const mockSidetreeData = 'some side tree data';
      let sidetreeDataSent = false;
      spyOn(SidetreeTransactionData as any, 'getSidetreeDataFromOutputIfExist').and.callFake(() => {
        if (!sidetreeDataSent) {
          sidetreeDataSent = true;
          return mockSidetreeData;
        }

        return undefined;
      });

      const mockOutputs: BitcoinOutputModel[] = [
        createValidDataOutput('mock data 1'),
        createValidDataOutput('mock data 2')
      ];

      const actual = SidetreeTransactionData['getValidSidetreeDataFromOutputs']('txid', mockOutputs, sidetreeTransactionPrefix);
      expect(actual).toEqual(mockSidetreeData);
      done();
    });

    it('should return undefined if no output has any sidetree data.', async (done) => {
      spyOn(SidetreeTransactionData as any, 'getSidetreeDataFromOutputIfExist').and.returnValue(undefined);

      const mockOutputs: BitcoinOutputModel[] = [
        createValidDataOutput('mock data 1'),
        createValidDataOutput('mock data 2')
      ];

      const actual = SidetreeTransactionData['getValidSidetreeDataFromOutputs']('txid', mockOutputs, sidetreeTransactionPrefix);
      expect(actual).not.toBeDefined();
      done();
    });

    it('should return undefined if there is more one output with the sidetree data.', async (done) => {
      let callCount = 0;
      spyOn(SidetreeTransactionData as any, 'getSidetreeDataFromOutputIfExist').and.callFake(() => {
        callCount++;

        if (callCount % 2 === 1) {
          return `mockSidetreeData ${callCount}`;
        }

        return undefined;
      });

      const mockOutputs: BitcoinOutputModel[] = [
        createValidDataOutput('mock data 1'),
        createValidDataOutput('mock data 2'),
        createValidDataOutput('mock data 2')
      ];

      const actual = SidetreeTransactionData['getValidSidetreeDataFromOutputs']('txid', mockOutputs, sidetreeTransactionPrefix);
      expect(actual).not.toBeDefined();
      done();
    });
  });

  describe('getSidetreeDataFromOutputIfExist', async () => {
    it('should return the data if the valid sidetree transaction exist', async (done) => {
      const sidetreeData = 'some test data';
      const mockDataOutput = createValidDataOutput(sidetreeData);

      const actual = SidetreeTransactionData['getSidetreeDataFromOutputIfExist'](mockDataOutput, sidetreeTransactionPrefix);
      expect(actual!).toEqual(sidetreeData);
      done();
    });

    it('should return undefined if no valid sidetree transaction exist', async (done) => {
      const mockOutput: BitcoinOutputModel = { satoshis:  0, scriptAsmAsString: 'some random data' };

      const actual = SidetreeTransactionData['getSidetreeDataFromOutputIfExist'](mockOutput, sidetreeTransactionPrefix);
      expect(actual).not.toBeDefined();
      done();
    });
  });

  describe('getValidWriterFromInputs', () => {
    it('should return correctly hashed value of the public key found.', () => {
      const mockPublicKey = 'some-public-key';
      spyOn(SidetreeTransactionData as any, 'getValidPublicKeyFromInputs').and.returnValue(mockPublicKey);

      const mockHashedValueBuffer = Buffer.from(mockPublicKey);
      spyOn(crypto.Hash, 'sha256ripemd160').and.returnValue(mockHashedValueBuffer);

      const expectedOutput = mockHashedValueBuffer.toString('hex');
      const actual = SidetreeTransactionData['getValidWriterFromInputs']('txid', []);
      expect(actual).toEqual(expectedOutput);
    });

    it('should return undefined if there is no valid public key found in the inputs.', () => {
      spyOn(SidetreeTransactionData as any, 'getValidPublicKeyFromInputs').and.returnValue(undefined);

      const actual = SidetreeTransactionData['getValidWriterFromInputs']('txid', []);
      expect(actual).not.toBeDefined();
    });
  });

  describe('getValidPublicKeyFromInputs', () => {
    it('should return the value if all the inputs have the have the same value.', () => {
      const mockPublicKey = 'public-key-writer';

      const mockInputs: BitcoinInputModel[] = [
        createValidWriterInput(mockPublicKey),
        createValidWriterInput(mockPublicKey),
        createValidWriterInput(mockPublicKey)
      ];

      const actual = SidetreeTransactionData['getValidPublicKeyFromInputs']('txid', mockInputs);
      expect(actual).toEqual(mockPublicKey);
    });

    it('should return undefined if one input does not have expected public key.', () => {
      const mockPublicKey = 'public-key-writer';

      const mockInputs: BitcoinInputModel[] = [
        createValidWriterInput(mockPublicKey),
        createValidWriterInput(mockPublicKey),
        { previousTransactionId: 'txid', outputIndexInPreviousTransaction: 0, scriptAsmAsString: 'onlySignature' }
      ];

      const actual = SidetreeTransactionData['getValidPublicKeyFromInputs']('txid', mockInputs);
      expect(actual).not.toBeDefined();
    });

    it('should return undefined if one input has different public key.', () => {
      const mockPublicKey = 'public-key-writer';

      const mockInputs: BitcoinInputModel[] = [
        createValidWriterInput(mockPublicKey),
        createValidWriterInput(mockPublicKey),
        createValidWriterInput('different-publick-key')
      ];

      const actual = SidetreeTransactionData['getValidPublicKeyFromInputs']('txid', mockInputs);
      expect(actual).not.toBeDefined();
    });

    it('should return undefined if there are no inputs.', () => {
      const actual = SidetreeTransactionData['getValidPublicKeyFromInputs']('txid', []);
      expect(actual).not.toBeDefined();
    });
  });
});