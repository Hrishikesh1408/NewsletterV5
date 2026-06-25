import jwt from 'jsonwebtoken';
import dbConnect from './dbConnect';
import User from '@/models/User';

export const rolePermissions = {
  platform: ["platform", "awards"],
  presales: ["presales", "awards"],
  qa: ["qa", "awards"],
  enterprise: ["enterprise", "awards"],
  sre: ["sre", "awards"],
  owner: ["platform", "presales", "qa", "enterprise", "sre", "ownerNotes", "title", "logo", "businessTopics", "upcomingEventsList", "awards", "spotlight", "joiners", "birthdays", "images", "sectionImages", "html", "intro", "activities", "mainContent", "events", "editors", "dynamicContent", "customSections", "templateId", "storefrontDowntime", "globalComponents", "ecpFunctionality", "productionReleases"],
  admin: ["platform", "presales", "qa", "enterprise", "sre", "ownerNotes", "title", "logo", "businessTopics", "upcomingEventsList", "awards", "spotlight", "joiners", "birthdays", "images", "sectionImages", "html", "intro", "activities", "mainContent", "events", "editors", "dynamicContent", "customSections", "templateId", "storefrontDowntime", "globalComponents", "ecpFunctionality", "productionReleases"]
};

export async function verifyAuth(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    await dbConnect();
    const user = await User.findById(decoded.id);
    if (!user) {
      return null;
    }

    return {
      id: user._id,
      username: user.email,
      email: user.email,
      firstName: user.firstName || user.email.split('@')[0],
      role: user.role
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}
