<template>
  <main style="max-width:720px;margin:24px auto;font-family:system-ui;">
    <h2>温度监测</h2>

    <section style="margin:16px 0;padding:12px;border:1px solid #eee;border-radius:8px;">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <label>串口:
          <select v-model="port">
            <option v-for="p in ports" :key="p.id" :value="p.id">
              {{ p.id }} - {{ p.name }}
            </option>
          </select>
        </label>

        <label>波特率:
          <select v-model.number="baud">
            <option v-for="b in baudOptions" :key="b" :value="b">{{ b }}</option>
          </select>
        </label>

        <button @click="apply" :disabled="saving">应用</button>
        <span v-if="saveMsg" style="margin-left:8px;color:#090;">{{ saveMsg }}</span>
      </div>
    </section>

    <section style="margin:16px 0;padding:12px;border:1px solid #eee;border-radius:8px;">
      <h3 style="margin:0 0 8px;">当前温度</h3>
      <div style="font-size:42px;font-weight:700;">
        {{ isNaN(value) ? '—' : value.toFixed(4) }} °C
      </div>
      <div style="color:#666;margin-top:6px;">时间：{{ ts }}</div>
    </section>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const value = ref(NaN);
const ts = ref('—');

const ports = ref([]);
const port  = ref('COM7');                // 默认你的端口
const baudOptions = [9600, 19200, 38400, 57600, 115200];
const baud = ref(57600);                  // 默认你的波特率
const saving = ref(false);
const saveMsg = ref('');

async function loadPorts() {
  try {
    const res = await fetch('http://localhost:8080/api/serial/ports');
    ports.value = await res.json();
  } catch {}
}

async function apply() {
  saving.value = true; saveMsg.value='';
  try {
    const body = { port: port.value, baudRate: baud.value, dataBits: 8, stopBits: 1, parity: 0 };
    await fetch('http://localhost:8080/api/serial/config', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    saveMsg.value = '已应用';
  } catch {
    saveMsg.value = '应用失败';
  } finally {
    saving.value = false;
    setTimeout(()=> saveMsg.value='', 2500);
  }
}

onMounted(async () => {
  await loadPorts();
  // SSE 实时接收
  const es = new EventSource('http://localhost:8080/api/temperature/stream');
  es.onmessage = (e) => {
    const d = JSON.parse(e.data);
    value.value = d.value;
    ts.value = d.ts;
  };
});
</script>
