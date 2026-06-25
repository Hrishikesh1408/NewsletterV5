const rolePermissions = {
  platform: ["platform"],
  presales: ["presales"],
  qa: ["qa"],
  enterprise: ["enterprise"],
  sre: ["sre"],
  owner: ["platform", "presales", "qa", "enterprise", "sre", "ownerNotes", "title", "logo", "businessTopics", "awards", "spotlight", "joiners", "birthdays", "images", "sectionImages", "html", "intro", "activities", "mainContent", "events", "editors"],
  admin: ["platform", "presales", "qa", "enterprise", "sre", "ownerNotes", "title", "logo", "businessTopics", "awards", "spotlight", "joiners", "birthdays", "images", "sectionImages", "html", "intro", "activities", "mainContent", "events", "editors"]
};

module.exports = rolePermissions;