## REST API

The following sections define the Sidetree resolution and operations endpoints. Please refer to the companion [Sidetree REST API](https://identity.foundation/sidetree/swagger/) specification for additional information, as well as REST API definitions for blockchain and CAS components.

### Sidetree Resolution

Sidetree resolution requests to the REST API are based on the [DID Resolution HTTP(S) binding](https://w3c-ccg.github.io/did-resolution/#bindings-https).
Resolution requests consist of a DID and MAY include DID parameters.
As detailed in [Resolution](#resolution), the resolution request MAY include the initial state DID parameter.

The server responds with the [DID Resolution Result](https://w3c-ccg.github.io/did-resolution/#did-resolution-result) composed of the DID Document and Method Metadata.
Sidetree defines `published`, `updateCommitment`, and `recoveryCommitment` method metadata.
   - `published` is detailed in [Published Property](#published-property).
   - `updateCommitment` is the commitement for the next update operation as defined in [commitment value generation](https://identity.foundation/sidetree/spec/#commitment-value-generation).
   - `recoveryCommitment` is the commitement for the next recover or deactivate operation as defined in [commitment value generation](https://identity.foundation/sidetree/spec/#commitment-value-generation).

::: example
```json
{
    "@context": "https://www.w3.org/ns/did-resolution/v1",
    "didDocument": DID_DOCUMENT_OBJECT,
    "methodMetadata": {
        "published": boolean,
        "updateCommitment": UPDATE_COMMITMENT,
        "recoveryCommitment": RECOVERY_COMMITMENT
    }
}
```
:::

A resolution is requested as follows:

1. The client ****MUST**** send a GET to the Sidetree resolution endpoint `/identifiers/{did-with-or-without-initial-state}` under the desired REST server path.
2. If the DID does not exist and initial state was not provided:
   - The server ****MUST**** respond with HTTP Status Code 404.
3. If the DID does not exist and valid initial state was provided:
   - The server ****MUST**** respond with HTTP Status Code 200.
   - The server ****MUST**** include the `didDocument` property, with its value set to the initial DID document that is constructed from the initial state.
   - The server ****MUST**** include the resolution response object `methodMetadata` composed of a `published` property with value `false`.
4. If the DID does exist and has not been deactivated:
   - The server ****MUST**** respond with HTTP Status Code 200.
   - The server ****MUST**** include the `didDocument` property, with its value set to the latest DID document.
   - The server ****MUST**** include the resolution response object `methodMetadata` composed of a `published` property with value `true`.
5. If the DID does exist and has been deactivated:
    - The server ****MUST**** respond with HTTP Status Code 410.
6. Otherwise, for failure, the server ****MUST**** respond with an appropriate HTTP Status Code (400, 401, 404, 500).

### Sidetree Operations

Sidetree operation requests to the REST API consist of a type property indicating the operation to be performed along with operation-specific properties and data.

::: example
```json
{
    "type": OPERATION_TYPE,
    ...
}
```
:::

A valid Sidetree Operation Request is a JSON document composed as follows:

1. The Operation Request ****MUST**** contain a `type` property, and its value ****MUST**** be a valid operation defined in
[File Structure](#file-structures). The defined operations are `create`, `recover`, `deactivate`, `update`.
2. Populate additional properties according to the appropriate subsection.
3. The client ****MUST**** POST the Operation Request JSON document to the Sidetree operation endpoint `/operations` under the desired REST server path.
4. The server ****MUST**** respond with HTTP status 200 when successful. Otherwise, for failure, the server ****MUST**** respond with an appropriate HTTP Status Code (400, 401, 404, 500).
   - In the case of a successful `create` operation, the server ****MUST**** return the DID Resolution Result for the DID as is detailed in [Sidetree Resolution](#sidetree-resolution).

#### Create

::: example
```json
{
    "type": "create",
    "suffix_data": SUFFIX_DATA_OBJECT,
    "delta": DELTA_OBJECT
}
```
:::

Use the following process to generate a Sidetree create operation JSON document for the REST API, composed as follows:

1. The object ****MUST**** contain a `type` property, and its value ****MUST**** be `create`.
2. The object ****MUST**** contain a `suffix_data` property, and its value must be a `Base64URL` encoded _Suffix Data Object_(#anchor-file-create-entry).
3. The object ****MUST**** contain an `delta` property, and its value must be a `Base64URL` encoded [_Create Operation Data Object_](#create-data-object).

#### Update

::: example
```json
{
    "type": "update",
    "did_suffix": DID_SUFFIX,
    "delta": DELTA_OBJECT,
    "signed_data": JWS_SIGNED_VALUE
}
```
:::

Use the following process to generate a Sidetree update operation JSON document for the REST API, composed as follows:

1. The object ****MUST**** contain a `type` property, and its value ****MUST**** be `update`.
1. The object ****MUST**** contain a `did_suffix` property, and its value ****MUST**** be the [DID Suffix](#did-suffix) of the DID the operation pertains to.
1. The object ****MUST**** contain an `delta` property, and its value ****MUST**** be a `Base64URL` encoded [_Update Operation Delta Object_](#update-data-object).
1. The object ****MUST**** contain a `signed_data` property, and its value ****MUST**** be a [IETF RFC 7515](https://tools.ietf.org/html/rfc7515) compliant JWS object
as defined in [Map File](https://identity.foundation/sidetree/spec/#map-file) for Update operations.

#### Recover

::: example
```json
{
    "type": "recover",
    "did_suffix": DID_SUFFIX,
    "delta": DELTA_OBJECT,
    "signed_data": JWS_SIGNED_VALUE
}
```
:::

Use the following process to generate a Sidetree recovery operation JSON document for the REST API, composed as follows:

1. The object ****MUST**** contain a `type` property, and its value ****MUST**** be `recover`.
1. The object ****MUST**** contain a `did_suffix` property, and its value ****MUST**** be the [DID Suffix](#did-suffix) of the DID the operation pertains to.
1. The object ****MUST**** contain an `delta` property, and its value ****MUST**** be a `Base64URL` encoded [_Recovery Operation Delta Object_](#recover-delta-object).
1. The object ****MUST**** contain a `signed_data` property, and its value ****MUST**** be a [IETF RFC 7515](https://tools.ietf.org/html/rfc7515) compliant JWS object
as defined in [Anchor File](https://identity.foundation/sidetree/spec/#anchor-file) for Recovery operations.

#### Deactivate

::: example
```json
{
    "type": "deactivate",
    "did_suffix": DID_SUFFIX,
    "signed_data": JWS_SIGNED_VALUE
}
```
:::

Use the following process to generate a Sidetree deactivate operation JSON document for the REST API, composed as follows:

1. The object ****MUST**** contain a `type` property, and its value ****MUST**** be `deactivate`.
1. The object ****MUST**** contain a `did_suffix` property, and its value ****MUST**** be the [DID Suffix](#did-suffix) of the DID the operation pertains to.
1. The object ****MUST**** contain a `signed_data` property, and its value ****MUST**** be a [IETF RFC 7515](https://tools.ietf.org/html/rfc7515) compliant JWS object
as defined in [Anchor File](https://identity.foundation/sidetree/spec/#anchor-file) for Deactivate operations.
