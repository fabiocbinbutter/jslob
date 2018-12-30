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

	// await test("Basic property access", async ()=>{
	// 	let str = '{"foo":true}'
	// 	let jslob = await JSLOB.parse(str)
	// 	let json = JSON.parse(str)
	// 	//await JSLOB.log(jslob)
	// 	assert.strictEqual(await jslob.bar,json.bar,	'.bar should be undefined')
	// 	assert.strictEqual(await jslob.foo,json.foo,	'.foo should be true')
	// 	assert.strictEqual(await jslob.fo, json.fo, 	'.fo should be undefined')
	// 	assert.strictEqual(await jslob.fooo,json.fooo,	'.fooo should be undefined')
	// 	})
	//
	// await test("Basic index access", async ()=>{
	// 		let str = '[0,1,2,3]'
	// 		let jslob = await JSLOB.parse(str)
	// 		let json = JSON.parse(str)
	// 		//await JSLOB.log()
	// 		//console.log(await jslob[3])
	// 		assert.strictEqual(await jslob[3], json[3],  '[3] should be set')
	// 		assert.strictEqual(await jslob[-1],json[-1], '[-1] should be undefined')
	// 		assert.strictEqual(await jslob[4], json[4],  '[4] should be undefined')
	// 		})
	//
	// await test("Silly type-coerced property access", async ()=>{
	// 		let str = '{"1":true}'
	// 		let jslob = await JSLOB.parse(str)
	// 		let json = JSON.parse(str)
	// 		//await JSLOB.log(jslob)
	// 		//console.log(await jslob[1])
	// 		//console.log(await jslob['1'])
	// 		assert.strictEqual(await jslob[1],json[1], 		'[1] should be true')
	// 		assert.strictEqual(await jslob["1"],json["1"],	'["1"] should be true')
	// 		})
	//
	// await test("Silly type-coerced index access", async ()=>{
	// 	let str = '[false,true,false]'
	// 	let jslob = await JSLOB.parse(str)
	// 	let json = JSON.parse(str)
	// 	//await JSLOB.log(jslob)
	// 	//console.log(await jslob[1])
	// 	//console.log(await jslob['1'])
	// 	assert.strictEqual(await jslob[1],json[1], 		'[1] should be true')
	// 	assert.strictEqual(await jslob["1"],json["1"],	'["1"] should be true')
	// 	})

	await test("Basic object round-trip", async ()=>{
		let json = `{
			"foo":1,
			"bar":true
			}`
		assert.deepStrictEqual(
			JSON.parse(await JSLOB.stringify( await JSLOB.parse(json))),
			JSON.parse(json),
			'Does not match!'
			)
		})

	await test("Non-primitive at index 0", async ()=>{
		let json = `[{"foo":"bar"},2,3]`
		let jslob = await JSLOB.parse(json)
		await JSLOB.log(jslob)
		})

	await test("Basic array round-trip", async ()=>{
		let json = `[1,2,3]`
		assert.deepStrictEqual(
			JSON.parse(await JSLOB.stringify( await JSLOB.parse(json))),
			JSON.parse(json),
			'Does not match!'
			)
		})

	// await test("Nested round-trip", async ()=>{
	// 	let json = `{
	// 			"a":[1],
	// 			"meta":{
	// 				"totalRows":3,
	// 				"dbl":[[{}]]
	// 				},
	// 			"rows":[
	// 				{"foo":"f00"},
	// 				{"bar":"ba7","baz":["ba8"]},
	// 				42
	// 				],
	// 			"c":null
	// 		}`
	// 	assert.deepStrictEqual(
	// 		JSON.parse(await JSLOB.stringify( await JSLOB.parse(json))),
	// 		JSON.parse(json),
	// 		'Does not match!'
	// 		)
	// 	})
	//
	// await test("Unusual keys", async ()=>{
	// 	let json = `{
	// 			"foo":{
	// 				"0":1
	// 			},
	// 			"f00":[2],
	// 			"bar":{
	// 				"":3,
	// 				"0":4,
	// 				"-1":5
	// 			}
	// 		}`
	// 	assert.deepStrictEqual(
	// 		JSON.parse(await JSLOB.stringify( await JSLOB.parse(json))),
	// 		JSON.parse(json),
	// 		'Does not match!'
	// 		)
	// 	})
	//
	//
	// await test("Multiple objects in store", async () => {
	// 	let jsonA = '{"a":1}'
	// 	let jsonB = '{"b":2}'
	// 	let jslobA = await JSLOB.stringify( await JSLOB.parse(jsonA))
	// 	let jslobB = await JSLOB.stringify( await JSLOB.parse(jsonB))
	// 	assert.deepStrictEqual(
	// 		JSON.parse(jslobA),
	// 		JSON.parse(jsonA),
	// 		'A does not match!'
	// 		)
	// 	assert.deepStrictEqual(
	// 		JSON.parse(jslobB),
	// 		JSON.parse(jsonB),
	// 		'B does not match!'
	// 		)
	// 	})
	//
	// await test("Stream in", async () => {
	// 	let filepath = path.resolve(__dirname,'./sample.json')
	// 	let json = fs.readFileSync(filepath)
	// 	let jsonStream = fs.createReadStream(filepath)
	// 	let jslob = await JSLOB.parse(jsonStream)
	//
	// 	assert.deepStrictEqual(
	// 		JSON.parse(await JSLOB.stringify(jslob)),
	// 		JSON.parse(json),
	// 		'Streaming did not work as expected'
	// 		)
	// 	})

	}()
