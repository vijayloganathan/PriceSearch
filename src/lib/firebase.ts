import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyAoW6WoEhotmoqvrrA-VPEuplBbrWf6lpg",
    authDomain: "milkproject-93c3a.firebaseapp.com",
    databaseURL: "https://milkproject-93c3a-default-rtdb.firebaseio.com",
    projectId: "milkproject-93c3a",
    storageBucket: "milkproject-93c3a.firebasestorage.app",
    messagingSenderId: "752081865547",
    appId: "1:752081865547:web:e8e167c372437fc469f6ce",
    measurementId: "G-X4C9WYFC97"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

export { db };
