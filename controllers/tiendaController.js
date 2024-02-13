const { initializeApp } = require('firebase/app');
//OJO!! nombre variable donde se almacena la cuenta de acceso servicio firebase: FIREBASE_CONFIG (no admite cualquier nombre)
//no meter el json aqui en fichero de codigo fuente como dice la doc...
const app = initializeApp(JSON.parse(process.env.FIREBASE_CONFIG));

//------------ CONFIGURACION ACCESO:  FIREBASE-AUTHENTICATION -------------
const { getAuth } = require('firebase/auth');

const auth = getAuth(app); //<--- servicio de acceso a firebase-authentication

//------------ CONFIGURACION ACCESO:  FIREBASE-DATABASE -------------------
const { getFirestore, getDocs, collection, where, query, addDoc, getDoc, orderBy, startAt } = require('firebase/firestore');

const db = getFirestore(app); //<---- servicio de acceso a todas las colecciones de la BD definida en firebase-database

module.exports = {
  recuperarLibros: async (req, res, next) => {
    try {
      let _idcat = req.query.idcat;

      console.log('recuperando datos de categoria...', _idcat)
      let _snapshotLibros = await getDocs(query(collection(db, 'libros'), orderBy('IdCategoria'), startAt(_idcat)))

      let _libros = []
      _snapshotLibros.forEach(snap => _libros.push(snap.data()))
      res.status(200).send(_libros)
    } catch (error) {
      console.log(error)
      res.status(500).send([])
    }
  },
  recuperarCategorias: async (req, res, next) => {

    try {
      let _idcat = req.query.idcat;
      console.log('categoria...', _idcat)
      let _regex;
      if (_idcat == "2-10") {
        _regex = new RegExp("^[0-9]{1,}$");
      } else {
        _regex = new RegExp("^" + _idcat + "-[0,9]{1,}$")
      }
      let _catSnaps = await getDocs(query(collection(db, 'categorias'), orderBy('IdCategoria')));

      let _cats = [];
      _catSnaps.forEach(catdoc => _cats.push(catdoc.data()));
      res.status(200).send(_cats.filter(cat => _regex.test(cat.IdCategoria)).sort((a, b) => parseInt(a.IdCategoria) < parseInt(b.IdCategoria) ? -1 : 1));


    } catch (error) {
      res.status(500).send([])
    }
  },
  recuperarLibro: async (req, res, next) => {
    try {
      let _isbn = req.query.isbn;
      console.log('cargando libro con isbn...', _isbn)
    
      let _query = await getDocs(query(collection(db, 'libros'), where("ISBN13", "==", _isbn)))
      let libro; 
      _query.forEach((doc) => {
        libro = doc.data()
      })
      console.log(libro)
      res.status(200).send(libro)
    } catch(error){
      res.status(500).send(error)
    }
  },
  RecuperarProvincias: async(req, res, next) => {
    try {

      var _snap = await getDocs(query(collection(db, 'provincias'), orderBy('PRO')))
      var _provincias = []
      _snap.forEach(d => _provincias.push(d.data()))
      res.status(200).send(_provincias)
    } catch(error){
      res.status(500).send('error...', error)
    }
    
  },
  recuperarMunicipios: async(req, res, next) => {
    try {
      let _prov = req.query.cpro;
      console.log(_prov)
      var _snap = await getDocs(query(collection(db, 'municipios'),  where('CPRO', '==', _prov)))

      let _municipios = []
      _snap.forEach(snap => _municipios.push(snap.data()))

      res.status(200).send(_municipios)
    } catch(error){
      console.log(error)
      res.status(500).send([])
    }
  }
}
