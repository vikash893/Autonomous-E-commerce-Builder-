const express = require('express');
const { catalogue } = require('../generator/catalogue');

const router = express.Router();

// GET /api/v1/modules - Get full module catalogue
router.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      catalogue: Object.values(catalogue).map((m) => ({
        key: m.key,
        name: m.name,
        description: m.description,
        icon: m.icon,
        category: m.category,
        dependsOn: m.dependsOn,
        options: m.options,
        envKeys: m.envKeys,
      })),
      allKeys: Object.keys(catalogue),
    },
  });
});

module.exports = router;