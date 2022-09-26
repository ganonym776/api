const firebase = require('../firebase/firebase');
const { db, admin, bucket } = require("../firebase/admin");
const { refreshToken } = require("firebase-admin/app");
const Multer = require('multer');
const {googleStorage, Storage} = require('@google-cloud/storage');
const axios = require('axios');
const {format} = require('util');
const FormData = require('form-data');

let now = admin.firestore.Timestamp.now(new Date());
let storage = new Storage({
    keyFilename: '../firebase/tenunara-firebase-adminsdk-fi2gu-4d7810e5b9.json'
})
let bucketName = 'ujicobaraya_bucket'
//  function to check user is authorized
exports.checkAuth = async (req, res, next) => {
    if (req.headers.authtoken) {
      admin.auth().verifyIdToken(req.headers.authtoken)
        .then(() => {
            next();
        }).catch(() => {
          res.status(403).send('User Unauthorized')
        });
    } else {
      res.status(403).send('User Unauthorized')
    }
}

const uploadImageToStorage = (destination, file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject('No image file');
      }
      let newFileName = `${destination}${file.originalname}`;
      let refFileName = `${destination}${file.originalname}`.replace("/", "%2F");
      let fileUpload = bucket.file(newFileName);
  
      const blobStream = fileUpload.createWriteStream({
        metadata: {
          contentType: file.mimetype
        }
      });
  
      blobStream.on('error', (error) => {
        console.log(error);
        reject('Something is wrong! Unable to upload at the moment.');
      });
  
      blobStream.on('finish', () => {
        // The public URL can be used to directly access the file via HTTP.
        const url = format(`https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${refFileName}`);
        resolve(url.toString());
      });
  
      blobStream.end(file.buffer);
    });
}

// All toko
exports.toko = async (req, res) => {
    const tokoRef = db.collection('Toko');
    try{
        tokoRef.get().then((snapshot) => {
            const data = snapshot.docs.map((doc) => ({
            tokoId: doc.id,
            ...doc.data(),
        }));
            console.log(data);
            return res.status(201).json(data);
        })
    } catch (error) {
        return res
        .status(500)
        .json({ general: "Something went wrong, please try again"});          
    }
};

// All kursus
exports.kursus = async (req, res) => {
    const kursusRef = db.collection('Kursus');
    try{
        kursusRef.get().then((snapshot) => {
            const data = snapshot.docs.map((doc) => ({
            kursusId: doc.id,
            ...doc.data(),
        }));
            console.log(data);
            return res.status(201).json(data);
        })
    } catch (error) {
        return res
        .status(500)
        .json({ general: "Something went wrong, please try again"});          
    }
};

// All history
exports.history = async (req, res) => {
    const historyRef = db.collection('Scan_history');
    try{
        historyRef.get().then((snapshot) => {
            const data = snapshot.docs.map((doc) => ({
            historyId: doc.id,
            Waktu : doc.data().Tanggal.toDate(),
            ...doc.data(),
        }));
            console.log(data);
            return res.status(201).json(data);
        })
    } catch (error) {
        return res
        .status(500)
        .json({ general: "Something went wrong, please try again"});          
    }
};

// tampil user scan history by userId
exports.historyUser = async (req, res) => {
    const historyRef = db.collection('Scan_history').where('Id_user', '==', req.query.id);
    try{
        historyRef.get().then((doc) => {
            if(doc.exists){
                historyRef.get().then((snapshot) => {
                    const data = snapshot.docs.map((doc) => ({
                    historyId: doc.id,
                    ...doc.data(),
                }));
                    console.log(data);
                    return res.status(201).json(data);
                })
            } else {
                return res.status(201).json('User belum memiliki history scan...')
            }
        })
    } catch (error) {
        return res
        .status(500)
        .json({ general: "Something went wrong, please try again"});          
    }
};

// User by ID
exports.profile = async  (req, res) => {
    const profileRef = db.collection('User');
    const user_Id = req.query.id;
    const profile = profileRef.where('__name__', '==' , user_Id);
    try{
        profile.get().then((snapshot) => {
            const data = snapshot.docs.map((doc) => ({
            userId: doc.id,
            ...doc.data(),
        }));
            console.log(data);
            return res.status(201).json(data);
        })
    } catch (error) {
        return res
        .status(500)
        .json({ general: "Something went wrong, please try again"});          
    }
};

// Tenun by ID
exports.tenun = async (req, res) => {
    const tenunRef = db.collection('Tenun');
    const tenun_Id = req.query.id;
    const tenun = tenunRef.where('__name__', '==' , tenun_Id);
    try{
        tenun.get().then((snapshot) => {
            const data = snapshot.docs.map((doc) => ({
            tenunId: doc.id,
            ...doc.data(),
        }));
            console.log(data);
            return res.status(201).json(data);
        })
    } catch (error) {
        return res
        .status(500)
        .json({ general: "Something went wrong, please try again"});          
    }
};

// Top weekly
exports.topWeekly = async (req, res) => {
    console.log(now);
    let lastWeek = now.seconds - 604800;
    try{
        const topRef = db.collection('Scan_history').where('Tanggal', '>=', lastWeek);
        topRef.get().then((doc) => {
            if(doc.exists){
                topRef.limit(10).get().then((snapshot) => {
                    const data = snapshot.docs.map((doc) => ({
                    tenunId: doc.id,
                    Waktu : doc.data().Tanggal.toDate(),
                    ...doc.data(),
                }));
                    console.log(data);
                    return res.status(201).json(data);
                })
            } else {
                return res.json('We Can\'t retrieve the data');
            }
        })
    } catch (error) {
        return res
        .status(500)
        .json({ general: "Something went wrong, please try again"});          
    }
};

// add new scan/history
exports.addHistory = async (req, res) => {
    const destination = "scan/";
    const historyRef = db.collection('Scan_history');
    let Nama_tenun = "";
    const file = req.file;
    const data = {
        Bagikan : false,
        Foto_scan : null,
        Id_user : req.body.userId,
        Id_tenun : null,
        Nama_user : req.body.Nama_user,
        Tanggal : now
    }
    try {
        if (file){
            const formData = new FormData();
            formData.append('file', file.buffer, file.originalname);
            const respon = await axios.post("https://tenunara-scanner-dot-tenunara-351304.et.r.appspot.com/scanner", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            Nama_tenun = respon.data.Nama_tenun;
            
            if(Nama_tenun === "Gringsing"){
                data.Id_tenun = "TN001"
            } else if(Nama_tenun === "Palembang"){
                data.Id_tenun = "TN002"
            } else if(Nama_tenun === "Ulos Ragihotang"){
                data.Id_tenun = "TN003"
            } else if(Nama_tenun === "Tenun Rangrang NTB"){
                data.Id_tenun = "TN004"
            } else if(Nama_tenun === "Tenun Sasak NTB"){
                data.Id_tenun = "TN005"
            } else if(Nama_tenun === "Tenun Ikat Dayak Sintang"){
                data.Id_tenun = "TN006"
            } else (
                respon.data.Nama_tenun = "Sorry we can\'t guessing this image.. :("
            )

            await uploadImageToStorage(destination, file).then((success) => {
                data.Foto_scan = success;
            }).catch((error) => {
                console.error(error);
            });

            historyRef.doc().set(data).then(() => {
                return res.status(201).json(respon)
            });
        }


    } catch(error) {
        return res
        .status(500)
        .json({ general: `Something went wrong, please try again. Detail: ${error.message}`});  
    }

};

// register
exports.registrasi = async (req, res) => {
    const destination = "user/";
    const User = db.collection('User');
    const file = req.file;
    const data = {
        Foto_user : null,
        Nama_user : req.body.nama,
        Telepon : req.body.telp
    }
    
    try {
        if (file){
            uploadImageToStorage(destination, file).then((success) => {
                data.Foto_user = success;
                User.doc(req.body.userId).set(data);
                return res.status(201).json(data.Nama_user + " have been added!");
              }).catch((error) => {
                console.error(error);
              });
        }
        
    } catch (error) {
        return res
        .status(500)
        .json({ general: `Something went wrong, please try again. Detail: ${error.message}`});          
    }
};

// login
exports.login = async (req, res) => {
    try {   
        firebase.auth().signInWithEmailAndPassword(req.body.email, req.body.password)
        .then((userCredential) => {
            var user = userCredential.user;
            if (user){
                return res.status(201).json('user')
            }
        })
    } catch (error) {
        return res
        .status(500)
        .json({ general: "Something went wrong, please try again"});          
    }
};

// signout
exports.signout = async (req, res) => {
try{
    firebase.auth().signOut().then(() => {
        // Sign-out successful.
      })
} catch(error){
    // An error happened.
  };
};

// update User telp & foto
exports.updateUser = async (req, res) => {
    const destination = "user/";
    const file = req.file;
    const User = db.collection('User').doc(req.body.userId);
    const data = {
        Foto_user : null,
        Telepon : req.body.telp
    }
    
    try {
        if (file){
            uploadImageToStorage(destination, file).then((success) => {
                data.Foto_user = success;
                User.doc(req.body.userId).set(data);
                return res.status(201).json('Success');
              }).catch((error) => {
                console.error(error);
              });
        }
        User.update(data);
        return res.status(201).json('User has been updated!');
        
    } catch (error) {
        return res
        .status(500)
        .json({ general: `Something went wrong, please try again. Detail: ${error.message}`});          
    }
};

// delete scan history (authorized)
exports.deleteHistory = async (req, res) => {
    try{
        const deleteRef = db.collection("Scan_history").doc(req.body.historyId);
        deleteRef.get().then((doc) => {
            if (doc.exists){
                deleteRef.delete().then(() => {
                return res.json('Document successfully deleted!');
                })
            } else {
                return res.json('History have not found!');
            }
        })
    } catch(error){
        return res
        .status(500)
        .json({ general: "Something went wrong, please try again"}); 
    }
};

// update history add Id tenun & edit bagikan
exports.updateHistory = async (req, res) => {
  const historyRef = db.collection('Scan_history').doc(req.body.historyId);
  const data = {
    Bagikan : false,
  }
  try{
    historyRef.get().then((doc) => {
        if (doc.exists) {
            historyRef.get().then((snapshot) => {
                const currentData = snapshot.data();
                data.Bagikan = currentData.Bagikan;
                data.Bagikan = req.body.Bagikan
                historyRef.update(data);
                return res.status(201).json(data)
            })
        } else {
            return res.json('History can\'t be found!');
        }
    })
  } catch(error) {
    return res
    .status(500)
    .json({ general: "Something went wrong, please try again"});
  }
};

// delete like from scan history (authorized)
exports.deleteLike = async (req, res) => {
    const historyRef = db.collection('Scan_history').doc(req.body.historyId);
    try{
        historyRef.get().then((doc) => {
            if(doc.exists){
                historyRef.collection('Like').doc(req.body.userId).delete().then(() => {
                return res.json("Dislike succesfull!");
                })
            } else {
                return res.json('This post can\'t be found!');
            } 
        })
    } catch(error){
        return res
        .status(500)
        .json({ general: "Something went wrong, please try again"});
    }
};

// add like to scan history (authorized)
exports.addLike = async (req, res) => {
    const historyRef = db.collection('Scan_history').doc(req.body.historyId);
    const data = {
        Tanggal: now,
    }
    try{
        historyRef.get().then((doc) => {
            if(doc.exists){
                historyRef.collection('Like').doc(req.body.userId).set(data).then(() => {
                return res.json("Like succesfull!");
                })
            } else {
                return res.json('This post can\'t be found!');
            } 
        })
    } catch(error){
        return res
        .status(500)
        .json({ general: "Something went wrong, please try again"});
    }
}