import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  headingOnly: { type: Boolean, default: false },
  color: { type: String, default: '#f97316' },
  order: { type: Number, default: 0 },
  content: { type: String, default: '' }
}, { _id: false });

// Add self-referencing children structure cleanly
sectionSchema.add({ children: [sectionSchema] });

const templateConfigSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  isDefault: { type: Boolean, default: false },
  sections: [sectionSchema],
  html: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

templateConfigSchema.statics.getDefaultConfig = function() {
  return {
    name: 'Engineering Team Template',
    description: 'Default template with Engineering Team structure',
    isDefault: true,
    sections: [
      {
        id: 'engineering-team',
        title: 'Engineering Team',
        enabled: true,
        headingOnly: false,
        color: '#f97316',
        order: 1,
        content: '',
        children: [
          {
            id: 'product-development',
            title: 'Product Development',
            enabled: true,
            headingOnly: false,
            color: '#f97316',
            order: 1,
            content: '',
            children: [
              {
                id: 'platform',
                title: 'Platform',
                enabled: true,
                headingOnly: false,
                color: '#f97316',
                order: 1,
                content: ''
              },
              {
                id: 'presales',
                title: 'Presales',
                enabled: true,
                headingOnly: false,
                color: '#f97316',
                order: 2,
                content: ''
              },
              {
                id: 'local-works',
                title: 'Local Works',
                enabled: true,
                headingOnly: false,
                color: '#f97316',
                order: 3,
                content: ''
              },
              {
                id: 'stores',
                title: 'Stores',
                enabled: true,
                headingOnly: false,
                color: '#f97316',
                order: 4,
                content: ''
              }
            ]
          }
        ]
      }
    ]
  };
};

const TemplateConfig = mongoose.models.TemplateConfig || mongoose.model('TemplateConfig', templateConfigSchema);
export default TemplateConfig;
