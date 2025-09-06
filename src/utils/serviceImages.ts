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

// Function to get appropriate image for a service based on name
export const getServiceImage = (serviceName: string): string => {
  // Try to match by service name
  const serviceLower = serviceName.toLowerCase();
  const imageKey = Object.keys(serviceImageMap).find(key => serviceLower.includes(key));
  
  return imageKey ? serviceImageMap[imageKey] : treatmentImage; // Default fallback
};

// Default service images for common services
export const defaultServiceImages = {
  haircut: haircutImage,
  beard: beardImage,
  treatment: treatmentImage,
};
