let JSLOB = require('../index.js')()
let assert = require('assert')
let path = require('path')
let fs = require('fs')

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

	await test("Complex Object Structure", async ()=>{
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

	await test("Multiple objects in store", async () => {
		let jsonA = '{"a":1}'
		let jsonB = '{"b":2}'
		let jslobA = await JSLOB.stringify( await JSLOB.parse(jsonA))
		let jslobB = await JSLOB.stringify( await JSLOB.parse(jsonB))
		assert.deepStrictEqual(
			JSON.parse(jslobA),
			JSON.parse(jsonA),
			'A does not match!'
			)
		assert.deepStrictEqual(
			JSON.parse(jslobB),
			JSON.parse(jsonB),
			'B does not match!'
			)
		})

	await test("Stream in", async () => {
		let filepath = path.resolve(__dirname,'./sample.json')
		let json = fs.readFileSync(filepath)
		let jsonStream = fs.createReadStream(filepath)
		let jslob = await JSLOB.parse(jsonStream)

		assert.deepStrictEqual(
			JSON.parse(await JSLOB.stringify(jslob)),
			JSON.parse(json),
			'Streaming did not work as expected'
			)
		})

	}()