type Metadata = {
  attributes?: {
    trait_type: string;
    value: string;
  }[];
  collection?: {
    name: string;
    id: string;
    attributes: {
      trait_type: string;
      value: string;
    }[];
  };
  description?: string;
  image?: string;
  format?: string;
  name?: string;
  sensitive_content?: 'false' | 'true' | true | false;
  minting_tool?: string;
  preview_video_uris?: string[];
  preview_video_hash?: string;
  preview_image_uris?: string[];
  preview_image_hash?: string;
};

export default Metadata;
