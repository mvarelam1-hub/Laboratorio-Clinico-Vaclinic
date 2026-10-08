// Centralized registry of high-resolution AI-generated professional medical laboratory images
import labHeroBanner from './images/lab_hero_banner_1788582067830.jpg';
import clinicalScientistWork from './images/clinical_scientist_work_1788582080395.jpg';
import diagnosticTechMicroscopy from './images/diagnostic_tech_microscopy_1788582101229.jpg';
import molecularTubesRobotics from './images/molecular_tubes_robotics_1788582113606.jpg';

import atlasBloodCells from './images/atlas_blood_cells_1788580399210.jpg';
import atlasFecalParasite from './images/atlas_fecal_parasite_1788580425461.jpg';
import atlasHelminthEgg from './images/atlas_helminth_egg_1788580436331.jpg';
import atlasUrineCrystals from './images/atlas_urine_crystals_1788580412854.jpg';
import atlasUrinePyocytes from './images/atlas_urine_pyocytes_1788580462968.jpg';

export const AI_LAB_IMAGES = {
  heroBanner: labHeroBanner,
  scientistWork: clinicalScientistWork,
  microscopyTech: diagnosticTechMicroscopy,
  molecularRobotics: molecularTubesRobotics,
  atlas: {
    bloodCells: atlasBloodCells,
    fecalParasite: atlasFecalParasite,
    helminthEgg: atlasHelminthEgg,
    urineCrystals: atlasUrineCrystals,
    urinePyocytes: atlasUrinePyocytes,
  }
};
