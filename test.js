let JSLOB = require('./index.js')
let assert = require('assert')

async function test(description, fn){
	console.log(description)
	try{
		await fn()
		console.log("> Ok")
		}
	catch(e){
		console.error(e)
		}
	}


!async function(){
	test("Complex Object Structure", async ()=>{
		let json = `{
				"a":1,
				"meta":{
					"totalRows":3,
					"dbl":[[{}]]
					},
				"rows":[
					{"foo":"f00"},
					{"bar":"ba7","baz":["ba8"]},
					42,
					{"":false,"0":true}
					],
				"c":null
			}`
		assert.deepStrictEqual(
			JSON.parse(await JSLOB.stringify( await JSLOB.parse(json))),
			JSON.parse(json),
			'Does not match!'
			)
		})
		
	}()
