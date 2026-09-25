export interface Parent {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  is_primary: boolean;
}

export interface Star {
  id: number;
  first_name: string;
  grade: number;
  school_name: string | null;
  school_district: string | null;
}

export interface Family {
  id: number;
  name: string;
  address_line1: string;
  city: string;
  state: string;
  zip: string;
  parents: Parent[];
  stars: Star[];
}
