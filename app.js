const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require("path");
const googleStorage = require('@google-cloud/storage');
var app = express();
const Multer = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024 //no larger than 10 MB
    }
});
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 8080
const { checkAuth, 
    toko, 
    kursus, 
    history, 
    profile, 
    tenun, 
    registrasi, 
    login, 
    signout, 
    deleteHistory, 
    updateHistory,
    addHistory,
    deleteLike, 
    addLike,
    topWeekly,
    historyUser,
    updateUser } = require('./route/handler');
// app.use('/history', checkAuth);
// app.use('/user', checkAuth);
// app.use('/like', checkAuth);

app.get('/toko', toko); // get all toko
app.get('/kursus', kursus); // get all kursus
app.get('/profile', profile);// tak terpakai
app.get('/allHistory', history); // get all history
app.get('/history', historyUser); // get scan history by id user. contoh: /history?id=.... |  and header{authToken}
app.get('/tenun', tenun); // get tenun details using query id tenun. contoh: /tenun?id=....
app.post('/reg', Multer.single('file'), registrasi); // add user foto, name, and telp. Requests must fulfill body{userId, nama, telp, file}
app.post('/login', login); // tak terpakai
app.post('/logout', signout); // tak terpakai
app.post('/history', Multer.single('file'), addHistory); // add new scan. Requests must fulfill body{userId, Nama_user, file} and header{authToken}
app.delete('/history', deleteHistory); // delete scan history. Requests must fulfill body{historyId} and header{authToken}
app.delete('/like', deleteLike); // delete like. Requests must fulfill body{userId, historyId}
app.get('/topWeekly', topWeekly); // get top 10 weekly
app.put('/history', updateHistory); // update history 'Bagikan' status.  Requests must fulfill body{historyId, Bagikan} and header{authToken}
app.put('/user', Multer.single('file'), updateUser); // tak terpakai
app.post('/like', addLike); // add like to scan post. Requests must fulfill body{userId, historyId} and header{authToken}



app.get('/', (req, res) => {
res.send('This is my demo project')
})

app.listen(PORT, function () {
console.log(`Demo project at: ${PORT}!`); });