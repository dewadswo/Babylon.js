﻿module BABYLON {
    interface IGLTFMaterialsPbrExtension {
        materialModel: string;
        values: any;
    }

    interface IGLTFMaterialsPbrExtensionCommonValues {
        normalTexture: string;
        normalScale: number;
        occlusionTexture: string;
        occlusionStrength: number;
        emissionFactor: number[];
        emissionTexture: string;
    }

    interface IGLTFMaterialsPbrExtensionSpecularGlossinessValues extends IGLTFMaterialsPbrExtensionCommonValues {
        diffuseFactor: number[];
        diffuseTexture: string;
        specularFactor: number[];
        glossinessFactor: number;
        specularGlossinessTexture: string;
    }

    interface IGLTFMaterialsPbrExtensionMetalRoughnessValues extends IGLTFMaterialsPbrExtensionCommonValues {
        baseColorFactor: number[];
        baseColorTexture: string;
        metallicFactor: number;
        roughnessFactor: number;
        metallicRoughnessTexture: string;
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
                case "PBR_metal_roughness":
                    onSuccess(this._loadMetalRoughnessMaterial(gltfRuntime, id, materialPbrExt));
                    break;
                default:
                    Tools.Error(this.name + " of material '" + id + "' specifies an unsupported material model '" + materialPbrExt.materialModel + "'");
                    onError();
                    break;
            }

            return true;
        }

        private _loadSpecularGlossinessMaterial(gltfRuntime: IGLTFRuntime, id: string, materialPbrExt: IGLTFMaterialsPbrExtension): Material {
            var material = new PBRMaterial(id, gltfRuntime.scene);
            material.sideOrientation = Material.CounterClockWiseSideOrientation;

            var values: IGLTFMaterialsPbrExtensionSpecularGlossinessValues = materialPbrExt.values;

            // Diffuse

            if (values.diffuseFactor) {
                material.albedoColor = Color3.FromArray(values.diffuseFactor);
                material.alpha = values.diffuseFactor[3];
            }

            if (values.diffuseTexture) {
                this._loadTexture(gltfRuntime, id, values.diffuseTexture, texture => {
                    material.albedoTexture = texture;
                    material.useAlphaFromAlbedoTexture = true;
                });
            }

            // Specular - Glossiness

            if (values.specularFactor) {
                material.reflectivityColor = Color3.FromArray(values.specularFactor);
            }

            material.microSurface = 1;
            if (values.glossinessFactor) {
                material.microSurface = values.glossinessFactor;
            }

            if (values.specularGlossinessTexture) {
                this._loadTexture(gltfRuntime, id, values.specularGlossinessTexture, texture => {
                    material.reflectivityTexture = texture;
                    material.useMicroSurfaceFromReflectivityMapAlpha = true;
                });
            }

            this._loadCommonMaterialProperties(gltfRuntime, id, values, material);

            return material;
        }

        private _loadMetalRoughnessMaterial(gltfRuntime: IGLTFRuntime, id: string, materialPbrExt: IGLTFMaterialsPbrExtension): Material {
            var material = new PBRMaterial(id, gltfRuntime.scene);
            material.sideOrientation = Material.CounterClockWiseSideOrientation;

            var values: IGLTFMaterialsPbrExtensionMetalRoughnessValues = materialPbrExt.values;

            // BaseColor

            if (values.baseColorFactor) {
                material.albedoColor = Color3.FromArray(values.baseColorFactor);
                material.alpha = values.baseColorFactor[3];
            }

            if (values.baseColorTexture) {
                this._loadTexture(gltfRuntime, id, values.baseColorTexture, texture => {
                    material.albedoTexture = texture;
                    material.useAlphaFromAlbedoTexture = true;
                });
            }

            // Metallic - Roughness

            if (values.metallicFactor) {
                material.metallic = values.metallicFactor;
            }

            if (values.roughnessFactor) {
                material.roughness = values.roughnessFactor;
            }

            if (values.metallicRoughnessTexture) {
                this._loadTexture(gltfRuntime, id, values.metallicRoughnessTexture, texture => {
                    material.metallicTexture = texture;
                    material.useRoughnessFromMetallicTextureAlpha = false;
                    material.useRoughnessFromMetallicTextureGreen = true;
                });
            }

            this._loadCommonMaterialProperties(gltfRuntime, id, values, material);

            return material;
        }

        private _loadCommonMaterialProperties(gltfRuntime: IGLTFRuntime, id: string, values: IGLTFMaterialsPbrExtensionCommonValues, material: PBRMaterial): void {
            // Normal

            if (values.normalTexture) {
                this._loadTexture(gltfRuntime, id, values.normalTexture, texture => {
                    material.bumpTexture = texture;
                    if (values.normalScale) {
                        material.bumpTexture.level = values.normalScale;
                    }
                });
            }

            // Occlusion

            if (values.occlusionTexture) {
                this._loadTexture(gltfRuntime, id, values.occlusionTexture, texture => {
                    material.ambientTexture = texture;
                    if (values.occlusionStrength) {
                        material.ambientTextureStrength = values.occlusionStrength;
                    }
                });
            }

            // Emission

            material.useEmissiveAsIllumination = true;

            if (values.emissionFactor) {
                material.emissiveColor = Color3.FromArray(values.emissionFactor);
            }

            if (values.emissionTexture) {
                this._loadTexture(gltfRuntime, id, values.emissionTexture, texture => {
                    material.emissiveTexture = texture;
                });
            }
        }

        private _loadTexture(gltfRuntime: IGLTFRuntime, materialId: string, textureId: string, onLoaded: (texture: Texture) => void): void {
            var onError = () => {
                Tools.Error("PBR material texture failed to load. material=\"" + materialId + "\", texture=\"" + textureId + "\"");
            };

            GLTFFileLoaderExtension.LoadTextureAsync(gltfRuntime, textureId, onLoaded, onError);
        }
    }

    GLTFFileLoader.RegisterExtension(new GLTFMaterialsPbrExtension());
}