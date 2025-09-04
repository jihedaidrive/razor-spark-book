import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ServiceCard from '@/components/ServiceCard';
import { Service } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Scissors, Star, Users, Clock, Phone, MapPin, Award, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import heroImage from '@/assets/hero-barber.jpg';
import haircutImage from '@/assets/haircut-service.jpg';
import beardImage from '@/assets/beard-service.jpg';
import treatmentImage from '@/assets/treatment-service.jpg';
import { servicesApi } from '@/api/servicesApi';

const Landing: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesData = await servicesApi.getServices();
        setServices(servicesData);
      } catch (error) {
        console.error('Failed to fetch services:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchServices();
  }, []);

  const handleBookService = (service: Service) => {
    window.location.href = `/booking?service=${service.id}`;
  };

  // Stats data with unique keys
  const statsData = [
    { icon: Scissors, count: '500+', label: 'Happy Clients', color: 'primary' },
    { icon: Star, count: '4.9', label: 'Rating', color: 'secondary' },
    { icon: Users, count: '5', label: 'Expert Barbers', color: 'primary' },
    { icon: Calendar, count: '3', label: 'Years Experience', color: 'secondary' },
  ];

  return (
    <div className="min-h-screen font-sans">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video or Image Background */}
        <img
          src={heroImage}
          alt="Barber Hero"
          className="absolute inset-0 w-full h-full object-cover brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-primary/30 to-black/80" />
        
        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 py-32 text-center text-white">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
            Masters of <span className="text-secondary animate-pulse">Modern Style</span>
          </h1>
          <p className="text-lg md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed">
            Experience the art of grooming with our expert barbers. 
            Where traditional craftsmanship meets modern style.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Button size="lg" variant="secondary" className="text-lg" asChild>
              <Link to={user ? "/booking" : "/register"}>
                <Calendar className="w-5 h-5 mr-2" /> Book Now
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg border-2 border-white text-white hover:bg-white hover:text-primary"
            >
              Our Services
            </Button>
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
            <div className="backdrop-blur-sm bg-white/10 rounded-lg p-6 border border-white/20">
              <Clock className="w-8 h-8 text-secondary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Opening Hours</h3>
              <p className="text-sm opacity-90">Mon-Sat: 9am - 6pm</p>
              <p className="text-sm opacity-90">Sun: Closed</p>
            </div>
            <div className="backdrop-blur-sm bg-white/10 rounded-lg p-6 border border-white/20">
              <Phone className="w-8 h-8 text-secondary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Contact Us</h3>
              <p className="text-sm opacity-90">+1 (123) 456-7890</p>
              <p className="text-sm opacity-90">info@razorspark.com</p>
            </div>
            <div className="backdrop-blur-sm bg-white/10 rounded-lg p-6 border border-white/20">
              <MapPin className="w-8 h-8 text-secondary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Location</h3>
              <p className="text-sm opacity-90">123 Style Street</p>
              <p className="text-sm opacity-90">Fashion District, City</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section with Image Gallery */}
      <section className="py-24 bg-muted/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <div>
              <h2 className="text-4xl font-bold mb-6">
                A Legacy of <span className="text-primary">Excellence</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Since 2020, Razor Spark has been defining men's grooming excellence. 
                Our master barbers combine traditional techniques with modern styles 
                to create looks that are both timeless and contemporary.
              </p>
              
              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-6">
                {[
                  { icon: Award, title: 'Expert Barbers', desc: 'Master craftsmen with years of experience' },
                  { icon: Sparkles, title: 'Premium Products', desc: 'Top-quality grooming products' },
                  { icon: Users, title: 'Personal Care', desc: 'Tailored service for every client' },
                  { icon: Star, title: 'Best Rated', desc: '4.9/5 customer satisfaction' }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col gap-2 p-4 rounded-lg hover:bg-muted/50 transition-colors">
                    <item.icon className="w-8 h-8 text-primary" />
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <img src={haircutImage} alt="Precision Haircut" className="rounded-lg w-full h-64 object-cover" />
                <img src={beardImage} alt="Beard Grooming" className="rounded-lg w-full h-48 object-cover" />
              </div>
              <div className="space-y-4 pt-8">
                <img src={treatmentImage} alt="Hair Treatment" className="rounded-lg w-full h-48 object-cover" />
                <img src={heroImage} alt="Barber Shop" className="rounded-lg w-full h-64 object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section with Enhanced Design */}
      <section className="py-20 bg-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-10" />
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
            {[
              { icon: Users, count: '500+', label: 'Satisfied Clients' },
              { icon: Star, count: '4.9', label: 'Average Rating' },
              { icon: Scissors, count: '5', label: 'Expert Barbers' },
              { icon: Calendar, count: '3', label: 'Years of Excellence' },
            ].map(({ icon: Icon, count, label }) => (
              <div key={label} className="text-center">
                <div className="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                  <Icon className="w-8 h-8" />
                </div>
                <div className="text-4xl font-bold mb-2">{count}</div>
                <div className="text-white/80">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section with Enhanced Design */}
      <section className="py-24 bg-background" id="services">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Premium Grooming <span className="text-primary">Services</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Discover our comprehensive range of professional grooming services, 
              tailored to enhance your style and confidence.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[...Array(3)].map((_, i) => (
                <div key={`loading-${i}`} className="animate-pulse rounded-lg bg-muted h-96" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {services.map((service, index) => (
                <div
                  key={service.id ?? `service-${index}`}
                  className={cn(
                    "group relative overflow-hidden rounded-xl shadow-lg transition-all duration-300",
                    "hover:shadow-2xl hover:-translate-y-1",
                    "animate-fade-in"
                  )}
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
            <div className="text-center mt-16 bg-muted/10 rounded-2xl p-12 max-w-3xl mx-auto">
              <h3 className="text-2xl font-semibold mb-4">Ready to Experience Premium Grooming?</h3>
              <p className="text-muted-foreground mb-6 text-lg">
                Join our community of satisfied clients and book your first appointment today.
              </p>
              <Button size="lg" variant="secondary" className="text-lg" asChild>
                <Link to="/register">
                  <Star className="w-5 h-5 mr-2" />
                  Get Started Today
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="relative py-32 text-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={treatmentImage}
            alt="Barber Service"
            className="w-full h-full object-cover brightness-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/80 to-secondary/90" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              Transform Your Style Today
            </h2>
            <p className="text-xl md:text-2xl mb-12 text-white/90 leading-relaxed">
              Experience the perfect blend of traditional craftsmanship and modern style. 
              Your journey to exceptional grooming starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
                <Link to={user ? "/booking" : "/register"}>
                  <Calendar className="w-5 h-5 mr-2" /> Book Your Visit
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 border-2 border-white text-white hover:bg-white hover:text-primary"
              >
                <Phone className="w-5 h-5 mr-2" /> Contact Us
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Info Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm py-4">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-white/80">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" /> Mon-Sat: 9am - 6pm
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2" /> +1 (123) 456-7890
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" /> 123 Style Street, Fashion District
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
