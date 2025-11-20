// Test script para verificar el API de firmas
import fetch from 'node-fetch';

async function testFirmas() {
  try {
    console.log('\n🧪 Probando API de firmas...\n');

    const response = await fetch('http://localhost:3000/api/firmas?empresaId=2');
    console.log('Status:', response.status);

    const data = await response.json();
    console.log('\n📦 Respuesta del API:');
    console.log(JSON.stringify(data, null, 2));

    if (data.success && data.data) {
      console.log('\n✅ API funcionando correctamente!');
      console.log(`📊 Encontradas ${data.data.length} firmas:\n`);

      data.data.forEach((firma, idx) => {
        console.log(`${idx + 1}. ${firma.nombre}`);
        console.log(`   Cargo: ${firma.cargo}`);
        console.log(`   URL: ${firma.firmaUrl}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFirmas();
