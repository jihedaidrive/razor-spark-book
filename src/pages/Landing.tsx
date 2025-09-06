import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ServiceCard from '@/components/ServiceCard';
import MobileLayout from '@/components/MobileLayout';
import { Service } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Scissors, Star, Users, Clock, Phone, MapPin, Award, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import heroImage from '@/assets/hero-barber.jpg';
import haircutImage from '@/assets/haircut-service.jpg';
import beardImage from '@/assets/beard-service.jpg';
import treatmentImage from '@/assets/treatment-service.jpg';
import { servicesApi } from '@/api/servicesApi';

const Landing: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { t } = useTranslation();

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
    <MobileLayout showBottomPadding={!!user}>
      {/* Mobile-First Hero Section */}
      <section className="relative min-h-[80vh] sm:min-h-screen flex items-center justify-center overflow-hidden -mx-4 -mt-4">
        {/* Mobile-optimized background */}
        <img
          src={heroImage}
          alt="Barber Hero"
          className="absolute inset-0 w-full h-full object-cover brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-primary/30 to-black/80" />
        
        {/* Mobile-first Hero Content */}
        <div className="relative z-10 px-6 py-16 text-center text-white max-w-sm sm:max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold mb-4 sm:mb-6 tracking-tight leading-tight">
            {t('landing.hero.title')}
          </h1>
          <p className="text-base sm:text-lg md:text-2xl mb-6 sm:mb-8 text-white/90 leading-relaxed">
            {t('landing.hero.subtitle')}
          </p>
          
          {/* Mobile-optimized CTA Buttons */}
          <div className="space-y-3 sm:space-y-0 sm:flex sm:justify-center sm:gap-4 mb-8 sm:mb-12">
            <Button size="lg" variant="secondary" className="mobile-btn w-full sm:w-auto" asChild>
              <Link to={user ? "/booking" : "/register"}>
                <Calendar className="w-5 h-5 mr-2" /> {t('landing.hero.cta')}
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="mobile-btn w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-primary"
            >
              {t('navigation.services')}
            </Button>
          </div>

          {/* Mobile-optimized Quick Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12">
            <Card className="backdrop-blur-sm bg-white/10 border-white/20">
              <CardContent className="p-4 text-center">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-secondary mx-auto mb-2 sm:mb-4" />
                <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Hours</h3>
                <p className="text-xs sm:text-sm opacity-90">Mon-Sat: 9am-6pm</p>
              </CardContent>
            </Card>
            <Card className="backdrop-blur-sm bg-white/10 border-white/20">
              <CardContent className="p-4 text-center">
                <Phone className="w-6 h-6 sm:w-8 sm:h-8 text-secondary mx-auto mb-2 sm:mb-4" />
                <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Call</h3>
                <p className="text-xs sm:text-sm opacity-90">(123) 456-7890</p>
              </CardContent>
            </Card>
            <Card className="backdrop-blur-sm bg-white/10 border-white/20 sm:col-span-1 col-span-1">
              <CardContent className="p-4 text-center">
                <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-secondary mx-auto mb-2 sm:mb-4" />
                <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Visit</h3>
                <p className="text-xs sm:text-sm opacity-90">123 Style Street</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mobile-First About Section */}
      <section className="py-12 sm:py-24 bg-muted/5">
        <div className="space-y-8 sm:space-y-16">
          {/* Mobile-first text content */}
          <div className="text-center sm:text-left">
            <h2 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-6">
              A Legacy of <span className="text-primary">Excellence</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg mb-6 sm:mb-8 leading-relaxed">
              Since 2020, Razor Spark has been defining men's grooming excellence. 
              Our master barbers combine traditional techniques with modern styles.
            </p>
          </div>

          {/* Mobile-optimized Features Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: Award, title: 'Expert Barbers', desc: 'Master craftsmen' },
              { icon: Sparkles, title: 'Premium Products', desc: 'Top-quality tools' },
              { icon: Users, title: 'Personal Care', desc: 'Tailored service' },
              { icon: Star, title: 'Best Rated', desc: '4.9/5 satisfaction' }
            ].map((item, i) => (
              <Card key={i} className="mobile-card hover:shadow-md transition-all duration-200">
                <CardContent className="mobile-card-content text-center">
                  <item.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary mx-auto mb-2 sm:mb-3" />
                  <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-tight">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Mobile-optimized Image Gallery */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-8">
            <div className="space-y-3 sm:space-y-4">
              <img src={haircutImage} alt="Precision Haircut" className="rounded-xl w-full h-32 sm:h-48 object-cover" />
              <img src={beardImage} alt="Beard Grooming" className="rounded-xl w-full h-24 sm:h-36 object-cover" />
            </div>
            <div className="space-y-3 sm:space-y-4 pt-4 sm:pt-8">
              <img src={treatmentImage} alt="Hair Treatment" className="rounded-xl w-full h-24 sm:h-36 object-cover" />
              <img src={heroImage} alt="Barber Shop" className="rounded-xl w-full h-32 sm:h-48 object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Mobile-First Stats Section */}
      <section className="py-12 sm:py-20 bg-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-10" />
        <div className="relative z-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {[
              { icon: Users, count: '500+', label: 'Happy Clients' },
              { icon: Star, count: '4.9', label: 'Rating' },
              { icon: Scissors, count: '5', label: 'Barbers' },
              { icon: Calendar, count: '3', label: 'Years' },
            ].map(({ icon: Icon, count, label }) => (
              <div key={label} className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-3 sm:mb-4 backdrop-blur-sm">
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2">{count}</div>
                <div className="text-white/80 text-xs sm:text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile-First Services Section */}
      <section className="py-12 sm:py-24 bg-background" id="services">
        <div className="space-y-8 sm:space-y-16">
          <div className="text-center">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-foreground">
              {t('landing.services.title')}
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground leading-relaxed">
              {t('landing.services.subtitle')}
            </p>
          </div>

          {isLoading ? (
            <div className="mobile-grid">
              {[...Array(3)].map((_, i) => (
                <div key={`loading-${i}`} className="animate-pulse rounded-xl bg-muted h-64 sm:h-80" />
              ))}
            </div>
          ) : (
            <div className="mobile-grid">
              {services.map((service, index) => (
                <div
                  key={service.id ?? `service-${index}`}
                  className={cn(
                    "group relative overflow-hidden rounded-xl shadow-lg transition-all duration-300",
                    "hover:shadow-xl hover:-translate-y-1",
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
            <Card className="mobile-card mt-8 sm:mt-16 max-w-md sm:max-w-2xl mx-auto">
              <CardContent className="mobile-card-content text-center">
                <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Ready to Get Started?</h3>
                <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">
                  Join our community and book your first appointment today.
                </p>
                <Button size="lg" variant="secondary" className="mobile-btn w-full sm:w-auto" asChild>
                  <Link to="/register">
                    <Star className="w-5 h-5 mr-2" />
                    Get Started
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Mobile-First CTA Section */}
      <section className="relative py-16 sm:py-32 text-white overflow-hidden -mx-4">
        <div className="absolute inset-0">
          <img
            src={treatmentImage}
            alt="Barber Service"
            className="w-full h-full object-cover brightness-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/80 to-secondary/90" />
        </div>
        
        <div className="relative z-10 px-6 text-center">
          <h2 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 tracking-tight">
            Transform Your Style
          </h2>
          <p className="text-base sm:text-xl md:text-2xl mb-8 sm:mb-12 text-white/90 leading-relaxed max-w-2xl mx-auto">
            Experience the perfect blend of traditional craftsmanship and modern style.
          </p>
          <div className="space-y-3 sm:space-y-0 sm:flex sm:gap-4 sm:justify-center">
            <Button size="lg" variant="secondary" className="mobile-btn w-full sm:w-auto" asChild>
              <Link to={user ? "/booking" : "/register"}>
                <Calendar className="w-5 h-5 mr-2" /> Book Your Visit
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="mobile-btn w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-primary"
            >
              <Phone className="w-5 h-5 mr-2" /> Contact Us
            </Button>
          </div>
        </div>

        {/* Mobile-optimized Bottom Info Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm py-3 sm:py-4">
          <div className="px-4">
            <div className="flex flex-col sm:flex-row sm:justify-center items-center gap-2 sm:gap-8 text-xs sm:text-sm text-white/80">
              <div className="flex items-center">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Mon-Sat: 9am-6pm
              </div>
              <div className="flex items-center">
                <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> (123) 456-7890
              </div>
              <div className="flex items-center">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> 123 Style Street
              </div>
            </div>
          </div>
        </div>
      </section>
    </MobileLayout>
  );
};

export default Landing;
