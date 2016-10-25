module BABYLON {
    interface IGLTFMaterialsPbrExtension {
        materialModel: string;
        values: Object;
    }

    export class GLTFMaterialsPbrExtension extends GLTFFileLoaderExtension {
        public constructor() {
            super("FRAUNHOFER_materials_pbr");
        }

        public loadMaterialAsync(gltfRuntime: IGLTFRuntime, id: string, onSuccess: (material: Material) => void, onError: () => void): boolean {
            var material: IGLTFMaterial = gltfRuntime.materials[id];
            if (!material.extensions || !(this.name in material.extensions)) {
                return false;
            }

            var materialPbrExt: IGLTFMaterialsPbrExtension = material.extensions[this.name];
            switch (materialPbrExt.materialModel) {
                case "PBR_specular_glossiness":
                    onSuccess(this._loadSpecularGlossinessMaterial(gltfRuntime, id, materialPbrExt));
                    break;
                default:
                    Tools.Error(this.name + " of material '" + id + "' specifies an unsupported material model '" + materialPbrExt.materialModel + "'");
                    onError();
                    break;
            }

            return true;
        }

        private _loadDiffuseTexture(gltfRuntime: IGLTFRuntime, materialId: string, textureId: string, pbrMaterial: PBRMaterial): void {
            var onSuccess = (texture: Texture) => {
                pbrMaterial.albedoTexture = texture;
                pbrMaterial.useAlphaFromAlbedoTexture = true;
            };

            var onError = () => {
                Tools.Error("Diffuse texture '" + textureId + "' of PBR material '" + materialId + "' failed to load");
            };

            GLTFFileLoaderExtension.LoadTextureAsync(gltfRuntime, textureId, onSuccess, onError);
        }

        private _loadSpecularGlossinessTexture(gltfRuntime: IGLTFRuntime, materialId: string, textureId: string, pbrMaterial: PBRMaterial): void {
            var onSuccess = (texture: Texture) => {
                pbrMaterial.reflectivityTexture = texture;
                pbrMaterial.useMicroSurfaceFromReflectivityMapAlpha = true;
            }

            var onError = () => {
                Tools.Error("Specular glossiness texture '" + textureId + "' of PBR material '" + materialId + "' failed to load");
            };

            GLTFFileLoaderExtension.LoadTextureAsync(gltfRuntime, textureId, onSuccess, onError);
        }

        private _loadSpecularGlossinessMaterial(gltfRuntime: IGLTFRuntime, id: string, materialPbrExt: IGLTFMaterialsPbrExtension): Material {
            var pbrMaterial = new PBRMaterial(id, gltfRuntime.scene);
            pbrMaterial.sideOrientation = Material.CounterClockWiseSideOrientation;
            for (var val in materialPbrExt.values) {
                var value = materialPbrExt.values[val];
                switch (val) {
                    case "diffuseFactor":
                        pbrMaterial.albedoColor = new Color3(value[0], value[1], value[2]);
                        pbrMaterial.alpha = value[3];
                        break;
                    case "specularFactor":
                        pbrMaterial.reflectivityColor = new Color3(value[0], value[1], value[2]);
                        break;
                    case "glossinessFactor":
                        pbrMaterial.microSurface = value;
                        break;
                    case "diffuseTexture":
                        this._loadDiffuseTexture(gltfRuntime, id, <string>value, pbrMaterial);
                        break;
                    case "specularGlossinessTexture":
                        this._loadSpecularGlossinessTexture(gltfRuntime, id, <string>value, pbrMaterial);
                        break;
                }
            }

            return pbrMaterial;
        }
    }

    GLTFFileLoader.RegisterExtension(new GLTFMaterialsPbrExtension());
}