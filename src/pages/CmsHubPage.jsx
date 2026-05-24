import React from 'react';
import { Tabs } from 'antd';
import { useSearchParams } from 'react-router-dom';
import AnnouncementsAdminPage from './AnnouncementsAdminPage';
import FeaturedTournamentsTab from './cms/FeaturedTournamentsTab';
import FeaturedPlayersTab from './cms/FeaturedPlayersTab';
import FeaturedTeamsTab from './cms/FeaturedTeamsTab';
import SponsorsTab from './cms/SponsorsTab';
import SiteSettingsTab from './cms/SiteSettingsTab';
import RegistrationsTab from './cms/RegistrationsTab';
import PageBanner from '../components/PageBanner';

const TAB_KEYS = ['registrations', 'news', 'tournaments', 'players', 'teams', 'sponsors', 'settings'];

export default function CmsHubPage() {
  const [params, setParams] = useSearchParams();
  const active = TAB_KEYS.includes(params.get('tab')) ? params.get('tab') : 'registrations';

  const onChange = (key) => {
    setParams({ tab: key }, { replace: true });
  };

  return (
    <div>
      <PageBanner
        kicker="CMS"
        title="Сайтын удирдлага"
        lede="Hero баннер, мэдээ, онцлох тэмцээн/тоглогч/баг, ивээн тэтгэгч, Footer/Login тохиргоо болон тэмцээний бүртгэлийн хүсэлтийг энд удирдана."
      />
      <Tabs
        activeKey={active}
        onChange={onChange}
        items={[
          { key: 'registrations', label: 'Бүртгэлийн хүсэлт', children: <RegistrationsTab /> },
          { key: 'news', label: 'Hero / Мэдээ', children: <AnnouncementsAdminPage embedded /> },
          { key: 'tournaments', label: 'Онцлох тэмцээнүүд', children: <FeaturedTournamentsTab /> },
          { key: 'players', label: 'Онцлох тоглогчид', children: <FeaturedPlayersTab /> },
          { key: 'teams', label: 'Онцлох багууд', children: <FeaturedTeamsTab /> },
          { key: 'sponsors', label: 'Ивээн тэтгэгчид', children: <SponsorsTab /> },
          { key: 'settings', label: 'Сайтын тохиргоо', children: <SiteSettingsTab /> },
        ]}
      />
    </div>
  );
}
