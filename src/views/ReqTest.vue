<template>
	
	<button @click="btn">按钮</button>
	{{msg}}
	<br />
	<input type="text" v-model="myname"/><br />
	<input type="text" v-model="myage"/>
</template>

<script setup lang="ts">
	import axios from 'axios';
	import { ref } from 'vue';
	
	let msg=ref("")
	let myname=ref("")
	let myage=ref("")
	
	function btn(){
		//访问后台服务器
		
		// axios.get(`http://localhost:8088/aaa?ttt=${myname.value}&age=${myage.value}`)
		// .then(res=>{
		// 	//console.log(res.data)
		// 	msg.value=res.data
		// })
		
		
		// let obj={
		// 	uname:myname.value,
		// 	upwd:123456,
		// 	usex:"男",
		// 	uage:myage.value
		// }
		// //如果传递的是JSON类型的数据，必须用post进行提交
		// axios.post("http://localhost:8088/getstu",obj)
		// .then(res=>{
		// 	console.log(res.data)
		// })
		
		//按照路径方式发送请求时，参数必须要有值，没有值就会出现路径错误
		// axios.get(`http://localhost:8088/getmm/${myname.value}/${myage.value}`)
		// .then(res=>{
		// 	console.log(res.data)
		// })
		
		axios.get("http://localhost:8088/getnum")
		.then(res=>{
			//let data=res.data;
			console.log(res.data)
		})
	}
</script>

<style>
</style>