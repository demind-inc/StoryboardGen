import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPen,
  faGear,
  faBars,
  faHashtag,
  faListCheck,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { faTiktok, faInstagram } from "@fortawesome/free-brands-svg-icons";

export const PencilIcon: React.FC = () => (
  <FontAwesomeIcon icon={faPen} style={{ width: 14, height: 14 }} />
);

export const SettingsIcon: React.FC = () => (
  <FontAwesomeIcon icon={faGear} style={{ width: 14, height: 14 }} />
);

export const LibraryIcon: React.FC = () => (
  <FontAwesomeIcon icon={faBars} style={{ width: 16, height: 16 }} />
);

export const TikTokIcon: React.FC = () => (
  <FontAwesomeIcon icon={faTiktok} style={{ width: 18, height: 18 }} />
);

export const InstagramIcon: React.FC = () => (
  <FontAwesomeIcon icon={faInstagram} style={{ width: 18, height: 18 }} />
);

export const CustomGuidelinesIcon: React.FC = () => (
  <FontAwesomeIcon icon={faListCheck} style={{ width: 18, height: 18 }} />
);

export const HashtagIcon: React.FC = () => (
  <FontAwesomeIcon icon={faHashtag} style={{ width: 18, height: 18 }} />
);

export const AIIcon: React.FC<{ className?: string }> = ({ className }) => (
  <FontAwesomeIcon
    icon={faWandMagicSparkles}
    style={{ width: 18, height: 18 }}
    className={className}
  />
);
