const level = require('level')
const os = require('os')
const path = require('path')
const JsonParser = require('jsonparse')
const {Readable,Transform} = require('stream')

const store = level(path.resolve(os.tmpdir(),'./jslob-'+Date.now()+'-'+Math.floor(Math.random()*100)))
let globalId = 1

const _store = Symbol()
const _JslobId = Symbol()

class Jslob {
	constructor (store,id){
		this[_store] = store
		this[_JslobId] = id
		}
	}


const JSLOB = {}
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
		let path ='#'+id+''
			+ stack.map(s =>
				s.key==undefined ? ''
				: typeof s.key == 'number' ? ':'+s.key //TODO: ensure string sorting for e.g., 9, 10
				: '/'+s.key )
			.join("")
		for(let s of stack){
			delete s.value
			}
		if(value !== undefined){
			latestPut = store.put(path, JSON.stringify(value))
			}
		}
	stream.on('data',function(d){jsonparser.write(d)})
	await streamEnd(stream)
	await latestPut
	return new Jslob(store, id)
	}

JSLOB.streamify = function streamify(jslob){
	let lastPath = []
	let xf = new Transform({
		writableObjectMode: true,
		readableObjectMode: true,
		transform: function jslobOutputTransform(data, encoding, cb){
			//e.g.	data.key -> "#1/rows:1/foo"
			let path = data.key
				.replace(/^#\d+/,"")
				.match(/(:\d+|\/[^/:]*(\\[:\/][^/:]*)*)(?=$|\/|:)/g)
			let delims = getDelimiters(lastPath,path)
			lastPath = path
			cb(null/*err*/, delims + data.value)
			},
		flush: function(cb){
			cb(null, getDelimiters(lastPath,[]))
			}
		})
	return store.createReadStream().pipe(xf)

	function getDelimiters(lastPath,nextPath){
		let out = []
		let ptr = 0
		let changeIndex = 0
		//e.g.	lastPath ->	["/meta",	"/totalRows"]
		//e.g.	nextPath -> ["/rows",	"1",		"/foo"]
		//console.log(lastPath)
		//console.log(nextPath)
		if(lastPath.length){ /* This section closes out objects and arrays*/
			for( ptr = 0; ptr < lastPath.length; ptr++){
				if(nextPath[ptr] !== lastPath[ptr]){break}
				}
			changeIndex = ptr //e.g., -1 in the above example
			for(ptr = lastPath.length-1; ptr > changeIndex ; ptr--){
				out.push(closing(lastPath[ptr]))
				}
			}
		if(!lastPath.length &&  nextPath.length){out.push(opening(nextPath[0]))}
		if( lastPath.length &&  nextPath.length){out.push(',')}
		if( lastPath.length && !nextPath.length){out.push(closing(lastPath[0]))}
		if(nextPath.length){
			out.push(getKeyString(nextPath[ptr]))
			for(ptr = changeIndex+1; ptr < nextPath.length; ptr++){
				out.push(opening(nextPath[ptr]))
				out.push(getKeyString(nextPath[ptr]))
				}
			}
		return out.join('')
		}
	function opening(key){return key[0]===':' ? '[' : '{'}
	function closing(key){return key[0]===':' ? ']' : '}'}
	function getKeyString(pathpart){
		if(!pathpart || pathpart[0]===':'){return ''}
		return JSON.stringify(pathpart.slice(1).replace(/\\./g,pair=>pair[1]))+":"
		}
	}

JSLOB.stringify = async function stringify(jslob){
	let out = ''
	await streamEnd(JSLOB.streamify(jslob).on('data', str => out+=str))
	return out
	}
JSLOB.log = function(jslob,limit = 10){
	let counter = 0
	JSLOB.streamify(jslob).on('data', d => {
		if(counter<limit){console.log(d)}
		if(counter==limit){console.log("...")}
		counter++
		})
	}

var exports = module.exports = JSLOB

function streamEnd(stream){ return new Promise(res => stream.on('end',res))}



// const { Readable } = require('stream')
//
// const streamS = Symbol()
//
// class Jslob {
// 	constructor: ()=>{
//
// 	}
// }
//
// const JSLOB = function(x){return x}
// //JSLOB.from
// JSLOB.parse = function(stringOrStream){
//
// 	}
// JSLOB.from = function(obj){
// 	let flat = flatten(obj)
//
// 	}
//
// JSLOB.streamify = function(jslob){
// 	const readable = new Readable({
// 		read: function(size) {
//
// 	 		}
// 		})
// 		return
// 	}
//
// const a = JSLOB.parse(`{"a":1,"b":2,"c":3}`)
// const outstreamA = JSLOB.streamify(a)
// process.stdout.write(a)
//
//
// const x = JSLOB.parse(`{"x":8,"y":9,"z":10}`)
// const merged = JSLOB({
// 	...a,
// 	...x
// 	})
// const outstreamMerged = JSLOB.streamify(merged)
// process.stdout.write(outstreamMerged)