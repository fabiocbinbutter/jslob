const lexint = require('lexicographic-integer')

let _arrayMarker = Symbol()

let charEncode = {
	"!":'E',
	"/":'S',
	"\\":'Z'
	}
let charDecode = {
	"E":'!',
	"S":'S',
	"Z":'\\'
	}

exports = module.exports = {
	keyEncode: function keyEncode(path){
		return pathEncode(path)+"/"
		},
	arrayMarker: function keyEncode(path){
		return pathEncode(path.slice(0,-1))+"/!"
		},
	keyRangeEnd: function keyRangeEnd(path){
		return pathEncode(path)+'\\'
		},
	keyDecode: function keyDecode(str){
		let fullpath = pathDecode(str.replace(/[/\\]$/,''))
		let isArrayMarker = false
		if(fullpath[fullpath.length-1] == _arrayMarker){
			fullpath = fullpath.slice(0,-1)
			isArrayMarker = true
			}
		return {
			id: fullpath[0],
			path: fullpath.slice(1),
			isArrayMarker
			}
		},
	propertyEncode, propertyDecode
	}


function pathEncode(path){
	if(typeof path[0] !== "number"){throw new  Error("JSLOB Id's are expected to be numeric. "+typeof path +" "+path)}
	return path.map(propertyEncode).join("/")
	}
function pathDecode(pathStr){
	return pathStr.split("/").map(propertyDecode)
	}
function propertyEncode(p){
	switch(typeof p){
		case "undefined":
			return ''
		case "number":
			return '!#'+lexint.pack(p,'hex')
		case "string":
			if(p.match(/^-?\d+$/)){
				return '!#'+lexint.pack(p,'hex')
				}
			return p.length == 0 ? '!-' : (
				(p.charCodeAt(0)>=34 ? p[0] : ('!x'+('000'+p.charCodeAt(0).toString(16)).slice(-4)))
				//First character should always be lexicographically after '!#' since JSLOB.stringify
				//will only look at the lexicographically first entry to differentiate between arrays and objects
				+ p.slice(1).replace(/[!/\\]/g, ch => charEnd[ch])
				)
		default:
			throw new Error('Unexpected property path component: '+(typeof p)+p)
		}
	}
function propertyDecode(p){
	if(p[0]=='!'){
		if(p[1]=='-' && p.length==2){return ''}
		if(p[1]=='#'){return lexint.unpack(p.slice(2))}
		if(!p[1]){return _arrayMarker}
		}
	return p
		.replace(/^!x([0-9a-f]{4})/,match=>parseInt(match[1],16))
		.replace(/!./g, chch => charDecode[chch[1]]||'')
	}
