<script setup>
// import { getDownloadURL, ref as storageRef, uploadString } from 'firebase/storage';
import { onMounted, ref } from 'vue';

const video = ref(null);
const canvas = ref(null);
const photoUrl = ref('');
const uploadedUrl = ref('');

onMounted(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        video.value.srcObject = stream;
    });
});

const capturePhoto = () => {
    const context = canvas.value.getContext('2d');
    canvas.value.width = video.value.videoWidth;
    canvas.value.height = video.value.videoHeight;
    context.drawImage(video.value, 0, 0, canvas.value.width, canvas.value.height);
    photoUrl.value = canvas.value.toDataURL('image/png');
};

const uploadPhoto = async () => {
    // const photoRef = storageRef(storage, `photos/${Date.now()}.png`);
    // await uploadString(photoRef, photoUrl.value, 'data_url');
    // uploadedUrl.value = await getDownloadURL(photoRef);
    alert('Photo uploaded successfully!');
};
</script>

<template>
    <div>
        <video ref="video" autoplay playsinline width="320" height="240"></video>
        <button @click="capturePhoto">Capture Photo</button>
        <canvas ref="canvas" style="display: none"></canvas>

        <div v-if="photoUrl">
            <h3>Captured Photo:</h3>
            <img :src="photoUrl" width="320" />
            <button @click="uploadPhoto">Upload Photo</button>
        </div>

        <div v-if="uploadedUrl">
            <h3>Uploaded to Firebase:</h3>
            <a :href="uploadedUrl" target="_blank">View Uploaded Image</a>
        </div>
    </div>
</template>

<style scoped>
video,
img {
    margin: 10px 0;
    border: 1px solid #ccc;
}
button {
    margin-top: 10px;
}
</style>
