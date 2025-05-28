// mockKipuOccupancy.ts
import { KipuOccupancy } from '~/types/kipu/kipuAdapter';

export const mockKipuOccupancy: KipuOccupancy = {
  beds: [
    { bed_id: 1, bed_name: 'Bed 1', enabled: true, status: 'occupied' },
    { bed_id: 2, bed_name: 'Bed 2', enabled: true, status: 'empty' }
  ],
  buildings: [
    {
      building_id: 101,
      building_name: 'Main Building',
      rooms: [
        {
          room_id: 201,
          room_name: 'Room A',
          gender_rule: 'male',
          beds: [
            {
              bed_id: 1,
              bed_name: 'Bed 1',
              enabled: true,
              status: 'occupied',
              gender: 'male',
              gender_identity: 'cisgender',
              casefile_id: '123:abc-def',
              first_name: 'John',
              last_name: 'Doe',
              admission_date: '2024-06-01',
              anticipated_discharge_date: '2024-06-10',
              dob: '1990-01-01',
              level_of_care: 'inpatient',
              program: 'Detox'
            },
            {
              bed_id: 2,
              bed_name: 'Bed 2',
              enabled: true,
              status: 'empty'
            }
          ]
        }
      ]
    }
  ],
  locations: [
    {
      location_id: 1001,
      location_name: 'North Campus',
      buildings: [
        {
          building_id: 102,
          building_name: 'Annex',
          rooms: [
            {
              room_id: 203,
              room_name: 'Room C',
              gender_rule: null,
              beds: [
                {
                  bed_id: 4,
                  bed_name: 'Bed 4',
                  enabled: false,
                  status: 'maintenance'
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};