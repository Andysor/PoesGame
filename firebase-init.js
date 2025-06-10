const firebaseConfig = {
    apiKey: "AIzaSyCLqLsgbNjF4u5moiX5cSlDAIYLsGOLuvo",
    authDomain: "poes-game.firebaseapp.com",
    projectId: "poes-game",
    storageBucket: "poes-game.firebasestorage.app",
    messagingSenderId: "108944813654",
    appId: "1:108944813654:web:0691c4d001ff22ce2d95f7",
    measurementId: "G-V5RRLNKDVZ"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  let highscoreList = [];

  async function loadHighscores() {
    const snapshot = await db.collection("highscores")
      .orderBy("score", "desc")
      .limit(10)
      .get();

    highscoreList = snapshot.docs.map(doc => doc.data());
  
    //requestAnimationFrame(draw); // Start rendering loop to show highscores
  }