const User = require('../models/User');
const Client = require('../models/Client');
const Master = require('../models/Master');
const Salon = require('../models/Salon');
const { Op } = require('sequelize');
const { createLogger } = require('../../../utils/logger');


const logger = createLogger('user-service');


const getProfile = async (userId) => {
  logger.info('Получение профиля пользователя', { userId });


  const user = await User.findByPk(userId);
  logger.info('Результат поиска пользователя по ID', { userId, userFound: !!user, userData: user ? { id: user.id, email: user.email, role: user.role, isActive: user.isActive } : null });


  const allUsers = await User.findAll({ where: { id: userId } });
  logger.info('Поиск пользователя через findAll', { userId, count: allUsers.length, users: allUsers.map(u => ({ id: u.id, email: u.email, role: u.role })) });

  if (!user) {
    logger.warn('Пользователь не найден', { userId });
    return null;
  }

  logger.info('Пользователь найден', { userId: user.id, role: user.role });

  let profile = {};

  switch (user.role) {
    case 'client':
      profile = await Client.findOne({ where: { user_id: userId } });
      logger.info('Получен профиль клиента', {
        userId,
        profileFound: !!profile,
        profileData: profile ? {
          firstName: profile.firstName,
          lastName: profile.lastName
        } : null
      });
      break;
    case 'master':
      profile = await Master.findOne({ where: { user_id: userId } });
      logger.info('Получен профиль мастера', {
        userId,
        profileFound: !!profile,
        profileData: profile ? {
          firstName: profile.firstName,
          lastName: profile.lastName,
          specialization: profile.specialization,
          experience: profile.experience,
          rating: profile.rating,
          bio: profile.bio
        } : null
      });
      break;
    case 'salon':
      profile = await Salon.findOne({ where: { user_id: userId } });
      logger.info('Получен профиль салона', {
        userId,
        profileFound: !!profile,
        profileData: profile ? {
          name: profile.name,
          description: profile.description,
          address: profile.address,
          phone: profile.phone,
          email: profile.email,
          rating: profile.rating
        } : null
      });
      break;
    case 'admin':

      profile = null;
      logger.info('Пользователь с ролью администратора', { userId, role: user.role });
      break;
    default:
      logger.error('Неверная роль пользователя', { userId, role: user.role });
      throw new Error('Неверная роль пользователя');
  }

  logger.info('Получение профиля завершено', {
    userId,
    profileExists: !!profile,
    profileData: profile ? {
      firstName: profile.firstName,
      lastName: profile.lastName,
      ...profile.get({ plain: true })
    } : null
  });


  const transformedProfile = profile ? {
    ...profile.get({ plain: true }),
    firstName: profile.firstName,
    lastName: profile.lastName
  } : null;


  if (transformedProfile && transformedProfile.image_url && 
      (transformedProfile.image_url.includes('example.com') || 
       transformedProfile.image_url.includes('fake-url') || 
       transformedProfile.image_url.includes('placeholder'))) {
    transformedProfile.image_url = null;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role
    },
    profile: transformedProfile
  };
};


const editProfile = async (userId, profileData) => {
  logger.info('Редактирование профиля пользователя', { userId, profileData });

  const user = await User.findByPk(userId);
  if (!user) {
    logger.error('Пользователь не найден для обновления профиля', { userId });
    throw new Error('Пользователь не найден');
  }

  const { email, phone, createProfile, avatar, ...profileDetails } = profileData;


  let cleanPhone = phone;
  if (phone) {

    cleanPhone = phone.replace(/\s|-|\(|\)|_/g, '');
    logger.info('Очищенный номер телефона', { original: phone, cleaned: cleanPhone });
  }


  if (email && email !== user.email) {
    const existingUser = await User.findOne({
      where: {
        [Op.and]: [
          { email },
          { id: { [Op.ne]: userId } }
        ]
      }
    });

    if (existingUser) {
      logger.warn('Email уже существует для другого пользователя', { email, userId });
      throw new Error('Email уже существует');
    }
  }

  if (cleanPhone && cleanPhone !== user.phone) {
    const existingUser = await User.findOne({
      where: {
        [Op.and]: [
          { phone: cleanPhone },
          { id: { [Op.ne]: userId } }
        ]
      }
    });

    if (existingUser) {
      logger.warn('Телефон уже существует для другого пользователя', { phone: cleanPhone, userId });
      throw new Error('Номер телефона уже существует');
    }
  }


  if (email || cleanPhone) {
    await user.update({ email, phone: cleanPhone });
    logger.info('Информация о пользователе обновлена', { userId, email, phone: cleanPhone });
  }


  const transformProfileFields = (details) => {
    const transformed = { ...details };

    if (transformed.firstName !== undefined) {
      transformed.first_name = transformed.firstName;
      delete transformed.firstName;
    }

    if (transformed.lastName !== undefined) {
      transformed.last_name = transformed.lastName;
      delete transformed.lastName;
    }


    if (transformed.salonName !== undefined) {
      transformed.name = transformed.salonName;
      delete transformed.salonName;
    }


    if (transformed.avatar) {

      const baseUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
      transformed.image_url = `${baseUrl}/${transformed.avatar}`;
      delete transformed.avatar;
    }

    return transformed;
  };


  const transformedProfileDetails = transformProfileFields(profileDetails);


  if (profileData.deleteAvatar) {

    transformedProfileDetails.image_url = null;
  } else if (avatar) {

    let avatarPath;
    if (typeof avatar === 'string') {

      avatarPath = avatar;
    } else if (avatar.path) {

      avatarPath = avatar.path;
    } else {

      console.warn('Avatar is not a valid path or file object:', typeof avatar);
      avatarPath = null;
    }

    if (avatarPath) {

      const baseUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
      const imageUrl = `${baseUrl}/${avatarPath}`;


      transformedProfileDetails.image_url = imageUrl;
    }
  } else if (profileData.image_url &&
             (profileData.image_url.includes('example.com') || 
              profileData.image_url.includes('fake-url') || 
              profileData.image_url.includes('placeholder'))) {

    transformedProfileDetails.image_url = null;
  }


  let updatedProfile;
  switch (user.role) {
    case 'client':
      updatedProfile = await Client.findOne({ where: { user_id: userId } });
      if (updatedProfile) {
        await updatedProfile.update(transformedProfileDetails);
        logger.info('Профиль клиента обновлен', { userId, profileDetails: transformedProfileDetails });
      } else if (createProfile) {

        updatedProfile = await Client.create({
          user_id: userId,
          ...transformedProfileDetails
        });
        logger.info('Профиль клиента создан', { userId, profileDetails: transformedProfileDetails });
      } else {
        logger.warn('Профиль клиента не найден для обновления', { userId });
      }
      break;
    case 'master':
      updatedProfile = await Master.findOne({ where: { user_id: userId } });
      if (updatedProfile) {
        await updatedProfile.update(transformedProfileDetails);
        logger.info('Профиль мастера обновлен', { userId, profileDetails: transformedProfileDetails });
      } else if (createProfile) {

        updatedProfile = await Master.create({
          user_id: userId,
          ...transformedProfileDetails
        });
        logger.info('Профиль мастера создан', { userId, profileDetails: transformedProfileDetails });
      } else {
        logger.warn('Профиль мастера не найден для обновления', { userId });
      }
      break;
    case 'salon':
      updatedProfile = await Salon.findOne({ where: { user_id: userId } });
      if (updatedProfile) {
        await updatedProfile.update(transformedProfileDetails);
        logger.info('Профиль салона обновлен', { userId, profileDetails: transformedProfileDetails });
      } else if (createProfile) {

        updatedProfile = await Salon.create({
          user_id: userId,
          ...transformedProfileDetails
        });
        logger.info('Профиль салона создан', { userId, profileDetails: transformedProfileDetails });
      } else {
        logger.warn('Профиль салона не найден для обновления', { userId });
      }
      break;
    case 'admin':

      logger.info('Профиль администратора не требует обновления', { userId, role: user.role });
      break;
    default:
      logger.error('Неверная роль пользователя для обновления профиля', { userId, role: user.role });
      throw new Error('Неверная роль пользователя');
  }

  const result = await getProfile(userId);
  logger.info('Редактирование профиля завершено', { userId });
  return result;
};


const findById = async (userId) => {
  logger.info('Поиск пользователя по ID', { userId });

  const user = await User.findByPk(userId);
  
  if (!user) {
    logger.warn('Пользователь не найден по ID', { userId });
    return null;
  }

  logger.info('Пользователь найден по ID', { userId: user.id, email: user.email, role: user.role });
  return user;
};

module.exports = {
  getProfile,
  editProfile,
  findById
};