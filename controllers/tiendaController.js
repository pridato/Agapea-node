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
    let cat = req.query.idcat
    console.log('buscando libros de la categoria...', cat)

    try {

      let _snapshot = await getDocs(query(collection(db, 'libros'), orderBy('IdCategoria'),startAt(cat)))

      let libros = []

      _snapshot.forEach(snap => libros.push(snap.data()))
      res.status(200).send(libros)

    }catch(error){
      res.status(500).send([])
    }
  },
  recuperarCategorias: async (req, res, next) => {
    console.log('recuperando... ', req.query)
    let _cat = req.query

    try {

      let _idcat = req.query.idcat;
      console.log('categoria...', _idcat)
      let _regex;
      if (_idcat == "2-10") {
        _regex = new RegExp("^[0-9]{1,}$");
      } else {
        _regex = new RegExp("^" + _idcat + "-[0-9]{1,}$")
      }
      let _catSnaps = await getDocs(query(collection(db, 'categorias'), orderBy('IdCategoria')));

      let _cats = [];
      _catSnaps.forEach(catdoc => _cats.push(catdoc.data()));
      res.status(200).send(_cats.filter(cat => _regex.test(cat.IdCategoria)).sort((a, b) => parseInt(a.IdCategoria) < parseInt(b.IdCategoria) ? -1 : 1));

    } catch(error){
      res.status(500).send([])
    }
  },
  recuperarLibro: async (req, res, next) => {
 
  },
  RecuperarProvincias: async(req, res, next) => {
    
  },
  recuperarMunicipios: async(req, res, next) => {
    
  }
}
