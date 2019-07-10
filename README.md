# JSLOB

JSLOB stands for **JS** **L**arge **OB**ject.

It's an _almost_ drop-in replacement for JSON that does not rely on memory, which makes it useful when your JSON-powered application chokes on large inputs.

**Status:** Alpha. Working but not stable.

### Usage

```js
const JSLOB = require('jslob')()

!async function smallExample(){
	// Just change JSON to JSLOB and add await!
	let jslob = await JSLOB.parse('{"foo":"bar"}')

	// Such wow!
	console.log(await jslob.foo) //bar

	// Much amaze!!
	console.log(await JSLOB.stringify(jslob)) // {"foo":"bar"}
	}()

!async function bigExample(){
	// I can has streamz?
	let stream = fs.createReadStream('package.json')
	let jslob = await JSLOB.parse(stream)

	console.log(await jslob.dependencies.jslob)

	// Can has all the streams
	JSLOB.streamify(jslob).on("data",chunk=>console.log(chunk))
	}()
```

### Wait, but how?

Rather than use magic, JSLOB will store your JSON data key-by-key in a [level-compliant datastore](https://github.com/Level/awesome#stores).

For portability, the default datastore that JSLOB uses is just an in-memory datastore, so you'll
want to provide your own datastore as follows:

```js
// Pick one from https://github.com/Level/awesome#stores
// const datastore = require('leveldown')
// const datastore = require('rocksdb')
const JSLOB = require('jslob')({leveldown: datastore})
```

### Features / API

|Feature | Description | Status | API |
|---|---|---|---|
|Parse String | Parse a (potentially huge) JSON string | Working | await JSLOB.parse('{}') |
|Parse Stream | Parse a (potentially huge) JSON stream | Working | await JSLOB.parse(readable) |
|String Out | String out JSON from a JSLOB | Working | await JSLOB.stringify(jslob) |
|Stream Out | Stream out JSON from a JSLOB | Working | JSLOB.streamify(jslob) |
|Getters | Transparently get properties | Working | jslob.foo //bar |
|Setters | Transparently set properties | TODO | jslob.foo = "baz" |
|Iterators+ | Enumerate, iterate, splat, etc | TODO | JSLOB.entries(jslob) & more |
|Destroy | Manually clean up expired objects | TODO | JSLOB.del(jslob) |
|GC | Automatically clean up expired objects | [Not currently  possible](https://github.com/tc39/proposal-weakrefs/issues/55) | N/A |
|Storage | Use any leveldown-compliant storage | Untested | const JSLOB = require('jslob')({leveldown:...}) |
|Type-mutating property re-use | The following JSON may return unexpected results | TODO | {"foo":[1],"foo":{"x":2}} |
|Large string in JSON | Stream large string values  | TODO | ["An individual value that is too large for memory ......."] |
