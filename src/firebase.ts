import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import "dotenv/config";

const firebaseConfig = {
    apiKey: "AIzaSyD6G-qB0yf-mImZwxVpeRulb6ftpZOrh9g",
    authDomain: "luces-de-casa-73961.firebaseapp.com",
    projectId: "luces-de-casa-73961",
    storageBucket: "luces-de-casa-73961.appspot.com",
    messagingSenderId: "327893965788",
    appId: "1:327893965788:web:0936f5b312c1e155370d19"
  };

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);

export function uploadFile(file) {
    const storageRef = ref(storage, 'some-child')
    uploadBytes(storageRef, file).then((snapshot) => {
        console.log('Uploaded a blob or file!');
    });
}