const express = require('express');
const { ResponseMessage } = require('../error/ResponseMessage');
const router = express.Router();

function mapCompanyProfile(cp) {
  if (!cp) return null;
  return {
    id: cp.id,
    company_name: cp.company_name || '',
    name: cp.company_name || '',
    phone: cp.phone || '',
    email: cp.email || '',
    logo: cp.logo || '',
    gstin: cp.gstin || '',
    fssai: cp.fssai || '',
    address: cp.address || '',
    state: cp.state || '',
    city: cp.city || '',
    country: cp.country || '',
    license_key: cp.license_key || '',
    store_id: cp.store_id || 'STORE_1',
    created_at: cp.created_at || cp.createdAt,
    updated_at: cp.updated_at || cp.updatedAt,
  };
}

// ==========================================
// 1. GET COMPANY PROFILE
// ==========================================
router.get('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const profile = await global.serverdbConnection.CompanyProfile.findOne({
      order: [['id', 'DESC']],
      raw: true,
    });

    response.data = profile ? mapCompanyProfile(profile) : null;
    response.companyProfile = response.data;
    response.setStatus(200);
  } catch (err) {
    console.error('Error fetching company profile:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to fetch company profile');
  }
  res.json(response);
});

router.get('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const profile = await global.serverdbConnection.CompanyProfile.findByPk(req.params.id, { raw: true });
    if (!profile) {
      response.setStatus(404);
      response.setMessage('Company profile not found');
    } else {
      response.data = mapCompanyProfile(profile);
      response.companyProfile = response.data;
      response.setStatus(200);
    }
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

// ==========================================
// 2. CREATE COMPANY PROFILE
// ==========================================
router.post('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const {
      company_name,
      name,
      phone,
      email,
      logo,
      gstin,
      fssai,
      address,
      state,
      city,
      country,
      license_key,
      store_id,
    } = req.body;

    const compName = (company_name || name || '').trim();

    if (!compName) {
      response.setStatus(400);
      response.setMessage('Company Name is required');
      return res.json(response);
    }

    // Check if a profile already exists
    const existing = await global.serverdbConnection.CompanyProfile.findOne({
      order: [['id', 'DESC']]
    });

    let savedProfile;
    if (existing) {
      // Update existing record
      await existing.update({
        company_name: compName,
        phone: phone || '',
        email: email || '',
        logo: logo !== undefined ? logo : existing.logo,
        gstin: gstin || '',
        fssai: fssai || '',
        address: address || '',
        state: state || '',
        city: city || '',
        country: country || '',
        license_key: license_key || '',
        store_id: store_id || existing.store_id || 'STORE_1',
      });
      savedProfile = existing;
    } else {
      // Create new profile
      savedProfile = await global.serverdbConnection.CompanyProfile.create({
        company_name: compName,
        phone: phone || '',
        email: email || '',
        logo: logo || '',
        gstin: gstin || '',
        fssai: fssai || '',
        address: address || '',
        state: state || '',
        city: city || '',
        country: country || '',
        license_key: license_key || '',
        store_id: store_id || 'STORE_1',
      });
    }

    const plain = savedProfile.get({ plain: true });
    response.setStatus(200);
    response.setMessage('Company Profile saved successfully in PostgreSQL');
    response.data = mapCompanyProfile(plain);
    response.companyProfile = response.data;
  } catch (err) {
    console.error('Error saving company profile:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to save company profile');
  }
  res.json(response);
});

// ==========================================
// 3. UPDATE COMPANY PROFILE (PUT /:id and PUT /)
// ==========================================
router.put('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const profile = await global.serverdbConnection.CompanyProfile.findByPk(req.params.id);
    if (!profile) {
      response.setStatus(404);
      response.setMessage('Company profile not found');
      return res.json(response);
    }

    const {
      company_name,
      name,
      phone,
      email,
      logo,
      gstin,
      fssai,
      address,
      state,
      city,
      country,
      license_key,
    } = req.body;

    const compName = (company_name !== undefined ? company_name : name !== undefined ? name : profile.company_name);

    await profile.update({
      company_name: compName ? compName.trim() : profile.company_name,
      phone: phone !== undefined ? phone : profile.phone,
      email: email !== undefined ? email : profile.email,
      logo: logo !== undefined ? logo : profile.logo,
      gstin: gstin !== undefined ? gstin : profile.gstin,
      fssai: fssai !== undefined ? fssai : profile.fssai,
      address: address !== undefined ? address : profile.address,
      state: state !== undefined ? state : profile.state,
      city: city !== undefined ? city : profile.city,
      country: country !== undefined ? country : profile.country,
      license_key: license_key !== undefined ? license_key : profile.license_key,
    });

    const plain = profile.get({ plain: true });
    response.setStatus(200);
    response.setMessage('Company Profile updated successfully in PostgreSQL');
    response.data = mapCompanyProfile(plain);
    response.companyProfile = response.data;
  } catch (err) {
    console.error('Error updating company profile:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to update company profile');
  }
  res.json(response);
});

router.put('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    let profile = await global.serverdbConnection.CompanyProfile.findOne({
      order: [['id', 'DESC']]
    });

    const {
      company_name,
      name,
      phone,
      email,
      logo,
      gstin,
      fssai,
      address,
      state,
      city,
      country,
      license_key,
    } = req.body;

    const compName = (company_name || name || '').trim();

    if (!profile) {
      profile = await global.serverdbConnection.CompanyProfile.create({
        company_name: compName,
        phone: phone || '',
        email: email || '',
        logo: logo || '',
        gstin: gstin || '',
        fssai: fssai || '',
        address: address || '',
        state: state || '',
        city: city || '',
        country: country || '',
        license_key: license_key || '',
        store_id: 'STORE_1',
      });
    } else {
      await profile.update({
        company_name: compName || profile.company_name,
        phone: phone !== undefined ? phone : profile.phone,
        email: email !== undefined ? email : profile.email,
        logo: logo !== undefined ? logo : profile.logo,
        gstin: gstin !== undefined ? gstin : profile.gstin,
        fssai: fssai !== undefined ? fssai : profile.fssai,
        address: address !== undefined ? address : profile.address,
        state: state !== undefined ? state : profile.state,
        city: city !== undefined ? city : profile.city,
        country: country !== undefined ? country : profile.country,
        license_key: license_key !== undefined ? license_key : profile.license_key,
      });
    }

    const plain = profile.get({ plain: true });
    response.setStatus(200);
    response.setMessage('Company Profile updated successfully in PostgreSQL');
    response.data = mapCompanyProfile(plain);
    response.companyProfile = response.data;
  } catch (err) {
    console.error('Error updating company profile:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to update company profile');
  }
  res.json(response);
});

// ==========================================
// 4. DELETE COMPANY PROFILE
// ==========================================
router.delete('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const profile = await global.serverdbConnection.CompanyProfile.findByPk(req.params.id);
    if (profile) {
      await profile.destroy();
    }
    response.setStatus(200);
    response.setMessage('Company profile deleted successfully from PostgreSQL');
  } catch (err) {
    console.error('Error deleting company profile:', err);
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

router.delete('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    await global.serverdbConnection.CompanyProfile.destroy({ where: {} });
    response.setStatus(200);
    response.setMessage('Company profile deleted successfully from PostgreSQL');
  } catch (err) {
    console.error('Error deleting company profile:', err);
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

module.exports = router;
