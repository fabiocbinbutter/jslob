const lexint = require('lexicographic-integer')

let _arrayMarker = Symbol()

let charEncode = {
	"!":'E',
	"/":'S',
	"\\":'Z'
	}
let charDecode = {
	"E":'!',
	"S":'/',
	"Z":'\\'
	}

exports = module.exports = {
	keyEncode,
	arrayMarker: function (path){
		return pathEncode(path.slice(0,-1))+"/!"
		},
	keyRangeEnd: function keyRangeEnd(path){
		return pathEncode(path)+'\\'
		},
	keyDecode,
	propertyEncode, propertyDecode
	}

function keyEncode(path){
	return pathEncode(path)+"/"
	}
function pathEncode(path){
	if(typeof path[0] !== "number"){throw new  Error("JSLOB Id's are expected to be numeric. "+typeof path +" "+path)}
	return path.map(propertyEncode).join("/")
	}
function propertyEncode(p){
	switch(typeof p){
		case "undefined":
			return ''
		case "number":
			return '!'+lexint.pack(p,'hex')
		case "string":
			if(p.match(/^(0|[1-9]\d*)$/)){
				return '!'+lexint.pack(p,'hex')
				}
			return p.replace(/[!/\\]/g, ch => '!'+charEncode[ch])
		default:
			throw new Error('Unexpected property path component: '+(typeof p)+p)
		}
	}

function keyDecode(str){
	let path = pathDecode(str.replace(/[/\\]$/,''))
	let isArrayMarker = false
	if(path[path.length-1] == _arrayMarker){
		path = path.slice(0,-1)
		isArrayMarker = true
		}
	return {path,isArrayMarker}
	}
function pathDecode(pathStr){
	return pathStr.split("/").map(propertyDecode)
	}
function propertyDecode(p){
	if(p[0]=='!'){
		if(!p[1]){return _arrayMarker}
		if(p[1]=='-' && p.length==2){return ''}
		if(p[1]>='0' && p[1]<='f' && (p[1]<='9' || p[1]>='a')){return lexint.unpack(p.slice(2))}
		}
	return p
		.replace(/!./g, chch => charDecode[chch[1]]||'')
		//.replace(/^!x([0-9a-f]{4})/,match=>parseInt(match[1],16))
	}
