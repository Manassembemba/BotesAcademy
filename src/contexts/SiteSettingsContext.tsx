import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SiteSettings {
  payment_methods: {
    mobile_money: string[];
    bank: string;
  };
  academy_info: {
    email: string;
    phone: string;
    support_link: string;
  };
  social_links: {
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
  };
  seo: {
    meta_title: string;
    meta_description: string;
  };
  global_banner: {
    is_active: boolean;
    text: string;
    link: string;
  };
  promo_overlay: {
    is_active: boolean;
    title: string;
    description: string;
    discount_text: string;
    promo_code: string;
    image_url: string;
    countdown_hours: number;
  };
  stats: {
    students: string;
    success_rate: string;
    countries: string;
    mentors: string;
  };
  categories: string[];
  appearance: {
    hero_image_url: string;
    hero_title: string;
    hero_description: string;
    primary_color: string;
  };
}

interface SiteSettingsContextType {
  settings: SiteSettings | null;
  isLoading: boolean;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export const SiteSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["site-settings-public"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings" as any).select("*");
      if (error) throw error;

      const formattedSettings: any = {};
      data.forEach((s: any) => {
        formattedSettings[s.key] = s.value;
      });

      return formattedSettings as SiteSettings;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  useEffect(() => {
    if (settingsData?.seo) {
      if (settingsData.seo.meta_title) {
        document.title = settingsData.seo.meta_title;
      }
      
      if (settingsData.seo.meta_description) {
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
          metaDescription = document.createElement('meta');
          metaDescription.setAttribute('name', 'description');
          document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', settingsData.seo.meta_description);
      }
    }
  }, [settingsData]);

  return (
    <SiteSettingsContext.Provider value={{ settings: settingsData || null, isLoading }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error("useSiteSettings must be used within a SiteSettingsProvider");
  }
  return context;
};
