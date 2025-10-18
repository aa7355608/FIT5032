<template>
  <section class="p-6 max-w-3xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">Send Email (Gmail API)</h1>
    <p class="mb-6 text-gray-600">
      Send an email with optional attachment via Cloud Function.
    </p>

    <div class="space-y-4">
      <div>
        <label class="block font-medium">To</label>
        <input v-model="to" type="email" class="input" placeholder="example@gmail.com" />
      </div>

      <div>
        <label class="block font-medium">Subject</label>
        <input v-model="subject" type="text" class="input" placeholder="Subject" />
      </div>

      <div>
        <label class="block font-medium">Message</label>
        <textarea v-model="message" class="input" rows="5" placeholder="Message"></textarea>
      </div>

      <div>
        <label class="block font-medium">Attachment (optional, ≤ 5MB)</label>
        <input type="file" @change="onFile" />
        <div v-if="fileName" class="text-sm mt-1 text-gray-500">Selected: {{ fileName }}</div>
      </div>

      <div class="flex gap-3 mt-4">
        <button @click="sendEmail" class="btn btn-primary">Send Email</button>
        <button @click="reset" class="btn btn-secondary">Reset</button>
      </div>

      <div class="mt-4 text-sm" :class="statusClass">{{ status }}</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

const to = ref("");
const subject = ref("");
const message = ref("");
const fileName = ref("");
const fileType = ref("");
const attachmentBase64 = ref<string | null>(null);
const status = ref("");

const statusClass = computed(() => {
  if (status.value.startsWith("✅")) return "text-green-600";
  if (status.value.startsWith("❌")) return "text-red-600";
  return "text-gray-600";
});

function reset() {
  to.value = "";
  subject.value = "";
  message.value = "";
  fileName.value = "";
  fileType.value = "";
  attachmentBase64.value = null;
  status.value = "";
}

async function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;

  fileName.value = f.name;
  fileType.value = f.type || "application/octet-stream";
  const buf = await f.arrayBuffer();
  attachmentBase64.value = btoa(String.fromCharCode(...new Uint8Array(buf)));
}

async function sendEmail() {
  try {
    status.value = "⏳ Sending...";
    const body: any = {
      to: to.value.trim(),
      subject: subject.value.trim(),
      message: message.value.trim(),
    };
    if (attachmentBase64.value) {
      body.attachment = {
        name: fileName.value,
        mime: fileType.value,
        contentBase64: attachmentBase64.value,
      };
    }

    const res = await fetch(import.meta.env.VITE_FN_EMAIL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (json.ok) {
      status.value = `✅ Email sent successfully${json.id ? " (ID: " + json.id + ")" : ""}`;
    } else {
      status.value = `❌ ${json.error || "Failed"}`;
    }
  } catch (err: any) {
    console.error(err);
    status.value = "❌ Failed to send email.";
  }
}
</script>

<style scoped>
.input {
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 8px;
  margin-top: 4px;
}
.btn {
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
}
.btn-primary {
  background: #2563eb;
  color: white;
}
.btn-secondary {
  background: #ddd;
  color: #333;
}
</style>
