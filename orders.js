const WHATSAPP_NUMBER = '201551415827';
const EMAIL_ADDRESS = '3d.stark.labs@gmail.com';

function loadCartSummary() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const summaryEl = document.getElementById('product-name-right'); // نستخدم عنصر واحد لعرض كل التفاصيل
  
    if (cart.length === 0) {
      summaryEl.innerText = 'No items in cart.';
      return;
    }
  
    let total = 0;
    let summaryText = '';
  
    cart.forEach((item, i) => {
      const lineTotal = item.price * item.quantity;
      total += lineTotal;
  
      const material = item.material || 'N/A';
      summaryText += `🔹 Item ${i + 1}:\n`;
      summaryText += `• Title: ${item.title}\n`;
      summaryText += `• Quantity: ${item.quantity} pcs\n`;
      summaryText += `• Unit Price: ${item.price} EGP\n`;
      summaryText += `• Total: ${lineTotal} EGP\n`;
      summaryText += `• 🧱 Material: ${material}\n\n`;
    });
  
    summaryText += `💰 Total Price: ${total} EGP`;
  
    summaryEl.innerText = summaryText.trim();
  
    // تخزين للمراسلة
    window.cartSummary = {
      items: cart,
      total
    };
  }
  


  window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('whatsapp-submit').addEventListener('click', sendWhatsAppMessage);
    document.getElementById('orderForm').addEventListener('submit', sendEmailMessage);
    
    loadCartSummary(); // ⬅️ تحميل ملخص السلة تلقائيًا
  });

  function buildMessage() {
    const name = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const gender = document.getElementById('gender').value.trim();
    const age = document.getElementById('age').value.trim();
    const service = document.getElementById('serviceType').value.trim();
    const description = document.getElementById('projectDescription').value.trim();
    const notes = document.getElementById('additionalNotes').value.trim();
  
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    let cartDetails = '';
    let totalPrice = 0;
  
    const now = new Date();
    const formattedDate = now.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  
    cart.forEach((item, i) => {
      const subtotal = item.quantity * item.price;
      const material = item.material || 'Not specified';
      const designLink = item.designLink || 'No link provided';
  
      cartDetails +=
        `\n🔹 *Item ${i + 1}:*\n` +
        `• Title: ${item.title}\n` +
        `• Quantity: ${item.quantity}\n` +
        `• Unit Price: ${item.price} EGP\n` +
        `• Total: ${subtotal} EGP\n` +
        `• 🧱 Material: ${material}\n` +
        `• 🔗 Design Link: ${designLink}\n` +
        `• 🗓️ Ordered: ${formattedDate}\n`;
  
      totalPrice += subtotal;
    });
  
    return (
      `🧾 *New 3D Printing Order Request*\n\n` +
      `👤 *Full Name:* ${name}\n` +
      `📧 *Email:* ${email}\n` +
      `📞 *Phone:* ${phone}\n` +
      (gender ? `⚧️ *Gender:* ${gender}\n` : '') +
      (age ? `🎂 *Age:* ${age}\n` : '') +
      `🛠️ *Service Type:* ${service}\n\n` +
      `📦 *Order Items:*\n${cartDetails}\n` +
      `💰 *Total Price:* ${totalPrice} EGP\n\n` +
      `📝 *Project Description:*\n${description}\n\n` +
      (notes ? `📌 *Additional Notes:*\n${notes}\n\n` : '') +
      `✅ I confirm the Terms & Conditions.`
    );
  }
  
  
  function sendWhatsAppMessage() {
    const message = buildMessage();
    console.log("Final WhatsApp message:\n", message);
  
    const encoded = encodeURIComponent(message);
    const url = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encoded}`;
  
    window.open(url, '_blank');
  }
function sendEmailMessage(e) {
  e.preventDefault();
  const subject = '3D Printing Order Request';
  const body = encodeURIComponent(buildMessage());
  const mailto = `mailto:${EMAIL_ADDRESS}?subject=${encodeURIComponent(subject)}&body=${body}`;
  window.open(mailto, '_blank');
}

// Bind listeners
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('whatsapp-submit').addEventListener('click', sendWhatsAppMessage);
  document.getElementById('orderForm').addEventListener('submit', sendEmailMessage);
});
