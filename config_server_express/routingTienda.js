const express = require('express');
const router = express.Router();
const tiendaController = require('../controllers/tiendaController')

router.get
  ('/RecuperarCategorias', tiendaController.recuperarCategorias);
router.get
  ('/RecuperarLibros', tiendaController.recuperarLibros);
router.get
  ('/RecuperarLibro', tiendaController.recuperarLibro);
router.get
  ('/RecuperarProvincias', tiendaController.RecuperarProvincias)
router.get
  ('/ObtenerMunicipios', tiendaController.recuperarMunicipios)
module.exports = router