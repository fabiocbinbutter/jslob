const JsonParser = require('jsonparse')
const {Readable,Transform} = require('stream')

const {arrayMarker,keyEncode,keyDecode,keyRangeEnd,propertyEncode,propertyDecode} = require('./lib/key-encoding.js')

let globalId = 1
let defaultLeveldown = require('memdown')
let defaultLevelPath; {
	let os = require('os')
	let  pathModule = require('path')
	defaultLevelPath = pathModule.resolve(os.tmpdir(),'./jslob-'+Date.now()+'-'+Math.floor(Math.random()*100))
	}
const _store = Symbol()
const _jslobPath = Symbol()

//_JSLOB.* is the internal API. Calls are not bound to JSLOB instances, but
//  rather expect the store and path to be passed intp the function call
_JSLOB = {}
_JSLOB.getStore = function _JSLOB_getStore(jslob){
	return jslob[_store]
	}
_JSLOB.getPath = function _JSLOB_getId(jslob){
	return jslob[_jslobPath]
	}
_JSLOB.get = async function JSLOB_get(store,path){
	//TODO: Expose a public version of _JSLOB.get with auto-prefixing & string-based path
	let key = keyEncode(path)
	let hit = false
	let value
	let range = {
		gte: key,
		lt: keyRangeEnd(path)
		}
	let read = store.createReadStream(range)
		.on("data", d=> {
			hit = true
			if(d.key === key){
				value = tryJsonParse(d.value,d.value)
				}
			})
	await streamEnd(read)
	//let promise = streamEnd(read).then( () => {
		if(value !== undefined){
			return value
			}
		if(hit){
			return Jslob(store,path)
			}
		return undefined
	//	})
	//return Jslob(store,path,promise)
	}
_JSLOB.set = function(store,path,value,stack){

	switch(true){
		// Delete / undefined case
		case typeof value == 'undefined':

			break;
		// Some "objects" result in string/number JSON output instead of "{...}"
		// According to the spec this is determined by checking internal slots
		// which we can't do. So, for now I'll just check against a few known
		// constructors. In the future, we may check a property that we make
		// available for this purpose, e.g. obj[JSLOB.OBJECT_TYPE_SYMBOL] == 'string'
		// https://tc39.github.io/ecma262/#sec-json.stringify

		//Single value
		case typeof value == 'string':
		case typeof value == 'number':
		case value === null:
		case value instanceof String:
		case value instanceof Date:
		case Array.isArray(value) && value.length === 0:
		case Object.keys(value).length === 0:

			break;
		case value instanceof Readable:
		case value instanceof Transform:
			return "TODO"
			//TODO
			break;
		case Array.isArray(value):
			//Iterate array and recurse
			//Make sure to somehow check for circularities!

			break;
		default:
			//Iterate Object.keys and recurse
			//Make sure to somehow check for circularities!

			break
		}
	}

const proxyDef = {
	get: /*usually async */ function get(that,prop,receiver){
		if(typeof prop == 'symbol'){return that[prop]}
		if(prop == 'then' && typeof that[prop] == 'function'){
			return that.then.bind(that)
			//return that.then(val => val == undefined ? undefined : val[prop])
			}
		let store = _JSLOB.getStore(that)
		let path = _JSLOB.getPath(that).concat(prop)
		return Jslob(
			store,
			path,
			_JSLOB.get(store,path)
			)
		},
	// set: /*usually async */ function set(that,prop,value,receiver){
	// 	if(typeof prop == 'symbol'){return false} //Might be allowed when mutating objects, TBD
	// 	if(prop === 'then' && typeof that[prop] == "function"){
	// 		return that.then.bind(that)
	// 		}
	// 	let store = _JSLOB.getStore(that)
	// 	let path = _JSLOB.getPath(that).concat(prop)
	// 	return Jslob(
	// 		store,
	// 		path,
	// 		_JSLOB.set(store,path,value)
	// 		)
	// 	}
	}
function Jslob (store, path, base){
	let jslob = base || {}
	if(typeof path[0] !== "number"){
		throw new Error("Jslob id must be numeric")
		}
	jslob[_store] = store
	jslob[_jslobPath] = path
	return new Proxy(jslob,proxyDef)
	}

exports = module.exports = function JSLOB_Factory({
	leveldown = defaultLeveldown,
	levelPath = defaultLevelPath,
	maxDepth
	} = {})
	{
	//const level = require('level-packager')(leveldown)
	//const closureStore = level(storepath)
	const closureStore = require('level-packager')(leveldown)(levelPath)
	const JSLOB = {
		parse,
		streamify,
		stringify,
		log
		}
	return JSLOB

	async function parse(str){
		let store = closureStore
		let id = globalId++
		let stream
		if(str instanceof Readable){
			stream = str
			}
		else if (typeof str == 'string'){
			//TODO: ^ Accept boxed strings?
			stream = new Readable
			stream.push(str)
			stream.push(null)
			}
		else{
			//TODO: Accept JSON objects
			throw new Error("JSLOB.parse accepts a string or Readable stream")
			}
		let jsonparser = new JsonParser()
		let latestPut
		jsonparser.onValue = function(value) {
			let stack = this.stack.concat(this)
			let path = stack.map(s=>s.key).filter(p=>p!==undefined)
			let key = keyEncode([id, ...path])
			for(let s of stack){
				delete s.value
				}
			if(this.key===0){
				store.put(arrayMarker([id,...path]),'[')
				}
			//TODO: Maybe fix test case "Overlapping properties (arr to obj)"
			if(value !== undefined){
				latestPut = store.put(key, JSON.stringify(value))
				}
			}
		stream
			.on('data',function(d){jsonparser.write(d)})
			.on('end',function(d){jsonparser.write("\n")})
			//^Otherwise jsonparse can't know that a number-only input has ended
		await streamEnd(stream)
		await latestPut
		//jsonparser.onValue = null //Maybe unnecessary?
		let jslob = Jslob(store, [id])
		return jslob
		}

	function streamify(jslob){
		let lastStack = []
		let xf = new Transform({
			objectMode: true,
			transform: (data, encoding, cb) => {
				let key = keyDecode(data.key)
				let {output,newStack} = stackTransition(lastStack,key.path,data.value,key.isArrayMarker)
				lastStack = newStack
				cb(null, output)
				},
			flush: cb => cb(null, stackTransition(lastStack,[]).output)
			})
		function stackTransition(oldStack,newPath,valueJson,isArrayMarker){
			let newStack = [],
				oldLen = oldStack.length,
				newLen = newPath.length,
				out = [],
				ptr = 0,
				changeIndex = 0,
				rootProp = oldLen ? oldStack[0].prop : newPath[0]

			//Matching stack parts
			for( ptr = 0; ptr < oldLen; ptr++){
				if(newPath[ptr] === oldStack[ptr].prop ){
					newStack[ptr] = oldStack[ptr]
					continue
					}
				break
				}
			//Note the index at which they diverge
			changeIndex = ptr
			//Close out arrays and objects
			for(ptr = oldLen-1; ptr > changeIndex - 1 ; ptr--){
				out.push(
					lastStack[ptr].isArray ?']':
					lastStack[ptr].isObject?'}':
					''
					)
				}
			//Insert comma if necessary
			if(oldLen>changeIndex && newLen){
				out.push(',')
				}
			//Add new parts to the new stack
			for(ptr = changeIndex; ptr < newLen; ptr++){
				let isArray = ptr === newLen-1 && isArrayMarker
				let isObject = ptr < newLen-1
				let prop = newPath[ptr]
				newStack[ptr] = {prop,isArray, isObject}
				if(ptr>0 && !newStack[ptr-1].isArray){
					out.push(JSON.stringify(''+prop)+":")
					}
				if(isArray){out.push('[')}
				if(isObject){out.push('{')}
				}
			if(!isArrayMarker && valueJson!==undefined){
				out.push(valueJson)
				}

			{ /* this section opens object and arrays and keys */

				}
			return {
				output: out.join(''),
				newStack
				}
			}
		let path = _JSLOB.getPath(jslob)
		let store = _JSLOB.getStore(jslob)
		return store
			.createReadStream({
				gte: keyEncode(path),
				lt: keyRangeEnd(path)
				})
			.pipe(xf)
		}

	async function stringify(jslob){
		let out = ''
		await streamEnd(JSLOB.streamify(jslob).on('data', str => out+=str))
		return out
		}

	function log(jslob,limit = 10){
		let counter = 0
		let store, path, range
		if(jslob){
			path = _JSLOB.getPath(jslob)
			store = _JSLOB.getStore(jslob)
			range = {
				gte: keyEncode(path),
				lt: keyRangeEnd(path)
				}
			console.log(`Logging from ${range.gte} to ${range.lt} ...`)
			}
		else {
			store = closureStore
			range = {}
			console.log(`Logging all...`)
			}
		return new Promise(res => store
			.createReadStream(range)
			.on('data', d => {
				if(counter<limit){console.log(d)}
				if(counter==limit){console.log("..."); res()}
				counter++
				})
			.on('end',res)
			)
		}
	return JSLOB
	}

function streamEnd(stream){ return new Promise(res => stream.on('end',res))}
function tryJsonParse(str,dft){try{return JSON.parse(str)}catch(e){return dft}}
