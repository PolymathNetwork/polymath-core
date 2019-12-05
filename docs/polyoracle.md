# PolyOracle Encrypted URL

## Motivation

To avoid replay attacks, Oraclize associates a particular encrypted string with the first contract it receives it from, and from them on only allows queries containing the same encrypted text to come from that contract.

This is possible as the encryption scheme used by Oraclize generates a new key each time its run, and so the same text will generate different output on each encryption.

This means we need to avoid encrypted key clash when running on testnet, mainnet & through the ethereum-bridge \(their website says they don't enforce this on testnets, but on Kovan it seems to be, and I'm seeing similar behaviour in ethereum-bridge\).

Every time we redeploy the PolyOracle we therefore need to regenerate the partially encrypted Oraclize URL. For test cases I hardcoded a particular instance of a free API key - we may need to reconsider this if we see testing failures due to rate limits on free accounts, but it would be better not to use the prod key for this.

## Dependencies

Download Oraclize tool:  
[https://github.com/oraclize/encrypted-queries](https://github.com/oraclize/encrypted-queries)

On OS X I needed the following python2 dependencies:  
`pip install cryptography --force-reinstall`  
`pip install base58`

## Encrypting API Key

Then, to encrypt the key run:  
`python encrypted_queries_tools.py -e -p 044992e9473b7d90ca54d2886c7addd14a61109af202f1c95e218b0c99eb060c7134c4ae46345d0383ac996185762f04997d6fd6c393c86e4325c469741e64eca9 {api_key}`  
where `{api_key}` is the Polymath API Key.

e.g. if key is 3114b619-4e35-3759-1e1e-a2cea35a5eb9 run:  
`python encrypted_queries_tools.py -e -p 044992e9473b7d90ca54d2886c7addd14a61109af202f1c95e218b0c99eb060c7134c4ae46345d0383ac996185762f04997d6fd6c393c86e4325c469741e64eca9 3114b619-4e35-3759-1e1e-a2cea35a5eb9`  
returning:  
`BDUKwVRCqHlmgo4dCWoghzrhwQ8XhKuxDEY8vedTqAcLEpJ7yyTYSkiIttqp6SJaMMk7j0toxjD/Y22AmdcJeeLulPTAk4lTWmIuobjtDUFUZmu9yQC7toiIMfMf0Tzy7ujfAw8m96RJJEs5IpYUt3owgfsh`

NB - A new key is generated every time data is encrypted, so running the command above will yield a different result to the output above.

## Updating URL

We only encrypt the API Key to keep the CMC endpoint in clear text for transparency on price source.

The full URL to set in `oracleURL` in the PolyOracle contract is then:  
`string public oracleURL = '[URL] json(https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=2496&convert=USD&CMC_PRO_API_KEY=${[decrypt] {encrypted_key}}).data."2496".quote.USD.price';`  
where `{encrypted_key}` is the output from the above step.

e.g. for the above key, this would be:  
`string public oracleURL = '[URL] json(https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=2496&convert=USD&CMC_PRO_API_KEY=${[decrypt] BDUKwVRCqHlmgo4dCWoghzrhwQ8XhKuxDEY8vedTqAcLEpJ7yyTYSkiIttqp6SJaMMk7j0toxjD/Y22AmdcJeeLulPTAk4lTWmIuobjtDUFUZmu9yQC7toiIMfMf0Tzy7ujfAw8m96RJJEs5IpYUt3owgfsh}).data."2496".quote.USD.price';`

