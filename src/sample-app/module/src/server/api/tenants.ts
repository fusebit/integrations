import express from "express";
const router = express.Router();

router.post('/login', async (req, res, next) => {
  req.session.tenantData = req.body;
  res.status(200);
  res.send(req.session.tenantData);
});

router.delete('/logout', (req, res, next) => {
  delete req.session.tenantData.currentTenantId;
  res.status(200);
  res.send(req.session.tenantData);
});

router.get('/', (req, res, next) => {
  if (!req.session.tenantData?.currentTenantId) {
    res.status(403);
  }
  res.send(req.session.tenantData || {});
})

export default router;
