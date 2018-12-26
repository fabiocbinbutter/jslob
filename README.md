# JSLOB

*JS Large OBject - The lazy way to work with JSON that won't fit in memory*

**Status:** Alpha. Working but not stable.

### Usage

```
const JSLOB = require('jslob')()

!async function smallExample(){
	let jslob = await JSLOB.parse('{"foo":"bar"}')
	let output = await JSLOB.stringify(jslob)
	console.log(output)
	}()

!async function bigExample(){
	let jslob = await JSLOB.parse(fs.createReadStream('package.json'))
	JSLOB.streamify(jslob).on(chunk=>console.log(chunk))
	}
```

### Features / API

|Feature | Description | Status | API |
|---|---|---|---|
|Parse String | Parse a (potentially huge) JSON string | Working | await JSLOB.parse('{"foo":"bar"}') |
|Parse Stream | Parse a (potentially huge) JSON stream | Working | await JSLOB.parse(readable) |
|String Out | String out JSON from a JSLOB | Working | await JSLOB.stringify(jslob) |
|Stream Out | Stream out JSON from a JSLOB | Working | JSLOB.streamify(jslob) |
|Getters | Transparently get properties | TODO | jslob.foo //bar |
|Setters | Transparently set properties | TODO | jslob.foo = "baz" |
|Destroy | Manually clean up expired objects | TODO | JSLOB.del(jslob) |
|GC | Automatically clean up expired objects | [Not currently  possible](https://github.com/tc39/proposal-weakrefs/issues/55) | N/A |
|Storage | Use any leveldown-compliant storage | Untested | const JSLOB = require('jslob')({leveldown:...}) |
