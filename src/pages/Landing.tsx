import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ServiceCard from '@/components/ServiceCard';
import { Service } from '@/types';
import { servicesService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Scissors, Star, Users } from 'lucide-react';
import heroImage from '@/assets/hero-barber.jpg';

const Landing: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const fetchedServices = await servicesService.getServices();
        setServices(fetchedServices);
      } catch (error) {
        console.error('Failed to fetch services:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleBookService = (service: Service) => {
    // Navigate to booking page with selected service
    window.location.href = `/booking?service=${service.id}`;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center hero-section overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Professional Barber Shop"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-secondary/80" />
        </div>
        
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            Premium
            <span className="block text-secondary">Barber Experience</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 animate-slide-up">
            Expert cuts, professional service, and the perfect style for modern gentlemen
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 animate-scale-in">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 py-4 min-w-[200px]"
              asChild
            >
              <Link to={user ? "/booking" : "/register"}>
                <Calendar className="w-5 h-5 mr-2" />
                Book Appointment
              </Link>
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-4 min-w-[200px] border-white text-white hover:bg-white hover:text-primary"
            >
              View Services
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                  <Scissors className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">500+</div>
              <div className="text-muted-foreground">Happy Clients</div>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
                  <Star className="w-8 h-8 text-secondary-foreground" />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">4.9</div>
              <div className="text-muted-foreground">Rating</div>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">5</div>
              <div className="text-muted-foreground">Expert Barbers</div>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-secondary-foreground" />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">3</div>
              <div className="text-muted-foreground">Years Experience</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-background" id="services">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Our Premium Services
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From classic cuts to modern styles, we offer a complete range of grooming services 
              for the discerning gentleman
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted rounded-lg h-48 mb-4" />
                  <div className="bg-muted rounded h-6 mb-2" />
                  <div className="bg-muted rounded h-4 mb-4" />
                  <div className="bg-muted rounded h-10" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {services.map((service, index) => (
                <div
                  key={service.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <ServiceCard
                    service={service}
                    onBookClick={user ? handleBookService : undefined}
                  />
                </div>
              ))}
            </div>
          )}

          {!user && (
            <div className="text-center mt-12">
              <p className="text-muted-foreground mb-4">
                Ready to book your appointment?
              </p>
              <Button size="lg" variant="default" asChild>
                <Link to="/register">
                  Get Started Today
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 hero-section text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready for Your Next Cut?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join hundreds of satisfied clients who trust us with their style. 
            Book your appointment today and experience the difference.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-8 py-4"
            asChild
          >
            <Link to={user ? "/booking" : "/register"}>
              <Calendar className="w-5 h-5 mr-2" />
              Book Your Appointment
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Landing;