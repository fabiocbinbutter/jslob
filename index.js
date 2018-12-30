const os = require('os')
const path = require('path')
const JsonParser = require('jsonparse')
const {Readable,Transform} = require('stream')

const {arrayMarker,keyEncode,keyDecode,keyRangeEnd,propertyEncode,propertyDecode} = require('./lib/key-encoding.js')

let globalId = 1
let defaultLeveldown = require('leveldown')
let defaultPath = path.resolve(os.tmpdir(),'./jslob-'+Date.now()+'-'+Math.floor(Math.random()*100))

const _store = Symbol()
const _JslobId = Symbol()


_JSLOB = {}
_JSLOB.getStore = function _JSLOB_getStore(jslob){
	return jslob[_store]
	}
_JSLOB.getId = function _JSLOB_getId(jslob){
	return jslob[_JslobId]
	}

exports = module.exports = function JSLOB_Factory({
	leveldown = defaultLeveldown,
	storepath = defaultPath
	} = {})
	{
	const level = require('level-packager')(leveldown)
	const store = level(storepath)
	const JSLOB = {}

	const proxyDef = {
		get: /*usually async */ function get(that,prop,receiver){
			if(typeof prop == 'symbol'){return that[prop]}
			let store = _JSLOB.getStore(that)
			let id = _JSLOB.getId(that)
			let path = [prop]
			return JSLOB.get(that,path)
			}
		}

	function Jslob (store,id){
		let jslob = {}
		jslob[_store] = store
		jslob[_JslobId] = id
		//stores.set(jslob,store)
		//ids.set(jslob,store)
		return new Proxy(jslob,proxyDef)
		// CONTINUE HERE
		//^ seems to be subtly breaking my elaborate web of store retrieval... :-/
		}

	JSLOB.parse = async function JSLOB_parse(str){
		let id = globalId++
		let stream
		if(str instanceof Readable){
			stream = str
			}
		else if (typeof str == 'string'){
			stream = new Readable
			stream.push(str)
			stream.push(null)
			}
		let jsonparser = new JsonParser()
		let latestPut
		jsonparser.onValue = function(value) {
			let stack = this.stack.concat(this)
			let path = stack.map(s=>s.key).filter(p=>p!==undefined)
			//console.log([id, ...path])
			let key = keyEncode([id, ...path])
			for(let s of stack){
				delete s.value
				}
			if(this.key===0){
				store.put(arrayMarker([id,...path]),'[]')
				}
			if(value !== undefined){

				latestPut = store.put(key, JSON.stringify(value))
				}
			}
		stream.on('data',function(d){jsonparser.write(d)})
		await streamEnd(stream)
		await latestPut
		//jsonparser.onValue = null //Maybe unnecessary?
		let jslob = Jslob(store, id)
		return jslob
		}

	JSLOB.get = async function JSLOB_get(jslob,path){
		let id = await _JSLOB.getId(jslob)
		let store = await _JSLOB.getStore(jslob)
		if(typeof path == "string"){
			path = keyDecode('!#'+id+path+'/').path
			}
		let key = keyEncode([id, ...path])
		let hit = false
		let value
		let range = {
			gte: key,
			lt: keyRangeEnd([id, ...path])
			}
		let read = store.createReadStream(range)
			.on("data", d=> {
				hit = true
				if(d.key === key){
					value = tryJsonParse(d.value,d.value)
					}
				})
		await streamEnd(read)
		if(value !== undefined){
			return value
			}
		if(hit){
			return "TODO: Some kind of recursive/prefixed Proxy"
			}
		return undefined
		}

	JSLOB.streamify = function streamify(jslob){
		let lastStack = []
		let xf = new Transform({
			objectMode: true,
			transform: (data, encoding, cb) => {
				let key = keyDecode(data.key)
				let nextPath = key.path
				let out = []
				let ptr = 0
				let changeIndex = 0

				//e.g.	lastPath ->	["/meta",	"/totalRows"]
				//e.g.	nextPath -> ["/rows",	"1",		"/foo"]
				if(lastStack.length){ /* This section closes out objects and arrays*/
					for( ptr = 0; ptr < lastStack.length; ptr++){
						if(nextPath[ptr] !== lastStack[ptr].prop ){break}
						}
					changeIndex = ptr //e.g., -1 in the above example
					for(ptr = lastStack.length-1; ptr > changeIndex ; ptr--){
						out.push(closing(lastStack.pop()))
						}
					}
				if( lastStack.length &&  nextPath.length){out.push(',')}
				if( lastStack.length && !nextPath.length){out.push(closing(lastStack[0]))}
				if(!lastStack.length &&  nextPath.length){
					out.push(opening({
						prop: nextPath[0],
						isArray: key.isArrayMarker && key.path.length==1
						}))
					}
				if( nextPath.length){
					for(ptr = changeIndex; ptr < nextPath.length; ptr++){
						let item = {
							prop:nextPath[ptr],
							isArray: key.isArrayMarker && ptr === key.path.length-1,
							isObject: ptr < key.path.length-1
							}
						out.push(getJsonKey(nextPath[ptr]))
						out.push(opening(item))
						lastStack.push(item)
						}
					}
				if(!key.isArrayMarker){out.push(data.value)}
				console.log(out.join(''))
				cb(null, out.join(''))
				},
			flush: cb => cb(null, "..."/*getDelimiters(lastPath,[])*/)
			})
		let id = _JSLOB.getId(jslob)
		let store = _JSLOB.getStore(jslob)
		return store
			.createReadStream({
				gte: keyEncode([id]),
				lt: keyRangeEnd([id])
				})
			.pipe(xf)

		function opening(item){return item.isArray ? '[' : item.isObject ? '{' : ''}
		function closing(item){return item.isArray ? ']' : item.isObject ? '}' : ''}
		function getJsonKey(prop){
			if(typeof prop == "number"){return ''}
			return JSON.stringify(prop)+":"
			}

		}

	JSLOB.stringify = async function stringify(jslob){
		let out = ''
		await streamEnd(JSLOB.streamify(jslob).on('data', str => out+=str))
		return out
		}
	JSLOB.log = function(jslob,limit = 10){
		let counter = 0
		let id, logStore, range
		if(jslob){
			id = _JSLOB.getId(jslob)
			logStore = _JSLOB.getStore(jslob)
			range = {
				gte: keyEncode([id]),
				lt: keyRangeEnd([id])
				}
			console.log(`Logging from ${range.gte} to ${range.lt} ...`)
			}
		else {
			logStore = store
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
