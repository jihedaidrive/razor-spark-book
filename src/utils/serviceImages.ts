// Service image mapping utility
import haircutImage from '@/assets/haircut-service.jpg';
import beardImage from '@/assets/beard-service.jpg';
import treatmentImage from '@/assets/treatment-service.jpg';
import shampooImage from '@/assets/shampoo-service.jpg';
import stylingImage from '@/assets/styling-service.jpg';
import mustacheImage from '@/assets/mustache-service.jpg';
import facialImage from '@/assets/facial-service.jpg';
import massageImage from '@/assets/massage-service.jpg';
import conditioningImage from '@/assets/conditioning-service.jpg';

// Service type to image mapping with comprehensive coverage
export const serviceImageMap: Record<string, string> = {
  // Haircut services
  'haircut': haircutImage,
  'coupe': haircutImage,
  'cut': haircutImage,
  'couper': haircutImage,
  'coiffure': haircutImage,
  
  // Styling services
  'styling': stylingImage,
  'style': stylingImage,
  'coiffage': stylingImage,
  'brushing': stylingImage,
  
  // Shampoo services
  'shampoo': shampooImage,
  'shampooing': shampooImage,
  'wash': shampooImage,
  'laver': shampooImage,
  'nettoyage': shampooImage,
  
  // Beard services
  'beard': beardImage,
  'barbe': beardImage,
  'trim': beardImage,
  'tailler': beardImage,
  'rasage': beardImage,
  
  // Mustache services
  'mustache': mustacheImage,
  'moustache': mustacheImage,
  
  // Facial services
  'facial': facialImage,
  'visage': facialImage,
  'face': facialImage,
  'soin visage': facialImage,
  
  // Treatment services
  'treatment': treatmentImage,
  'traitement': treatmentImage,
  'soin': treatmentImage,
  'care': treatmentImage,
  'therapy': treatmentImage,
  'thérapie': treatmentImage,
  
  // Massage services
  'massage': massageImage,
  'relaxation': massageImage,
  'relax': massageImage,
  
  // Conditioning services
  'conditioning': conditioningImage,
  'conditioner': conditioningImage,
  'conditionnement': conditioningImage,
  'nourrissant': conditioningImage,
  'hydratant': conditioningImage,
};

// Categorized service images for better randomization
const imageCategories = {
  hairServices: [haircutImage, stylingImage, shampooImage, conditioningImage],
  facialServices: [beardImage, mustacheImage, facialImage],
  treatmentServices: [treatmentImage, massageImage],
};

// All available service images for randomization
const allServiceImages = [
  haircutImage,
  beardImage,
  treatmentImage,
  shampooImage,
  stylingImage,
  mustacheImage,
  facialImage,
  massageImage,
  conditioningImage,
];

// Enhanced service type to category mapping
const serviceCategoryMap: Record<string, keyof typeof imageCategories> = {
  'haircut': 'hairServices',
  'coupe': 'hairServices',
  'styling': 'hairServices',
  'shampoo': 'hairServices',
  'shampooing': 'hairServices',
  'conditioning': 'hairServices',
  'beard': 'facialServices',
  'barbe': 'facialServices',
  'mustache': 'facialServices',
  'moustache': 'facialServices',
  'facial': 'facialServices',
  'visage': 'facialServices',
  'treatment': 'treatmentServices',
  'traitement': 'treatmentServices',
  'massage': 'treatmentServices',
  'soin': 'treatmentServices',
};

// Function to get appropriate image for a service based on name with smart randomization
export const getServiceImage = (serviceName: string, serviceId?: string): string => {
  const serviceLower = serviceName.toLowerCase();
  
  // First, try to find a category match
  const categoryKey = Object.keys(serviceCategoryMap).find(key => serviceLower.includes(key));
  
  if (categoryKey) {
    const category = serviceCategoryMap[categoryKey];
    const categoryImages = imageCategories[category];
    
    // Use deterministic randomization within the category
    const seed = serviceId || serviceName;
    const hash = seed.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const imageIndex = Math.abs(hash) % categoryImages.length;
    return categoryImages[imageIndex];
  }
  
  // If no category match, try exact service mapping
  const imageKey = Object.keys(serviceImageMap).find(key => serviceLower.includes(key));
  if (imageKey) {
    return serviceImageMap[imageKey];
  }
  
  // Final fallback: deterministic random from all images
  const seed = serviceId || serviceName;
  const hash = seed.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const imageIndex = Math.abs(hash) % allServiceImages.length;
  return allServiceImages[imageIndex];
};

// Function to get a completely random service image (for variety)
export const getRandomServiceImage = (): string => {
  const randomIndex = Math.floor(Math.random() * allServiceImages.length);
  return allServiceImages[randomIndex];
};

// Default service images for common services
export const defaultServiceImages = {
  haircut: haircutImage,
  beard: beardImage,
  treatment: treatmentImage,
};
