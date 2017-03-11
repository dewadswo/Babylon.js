#if defined(BUMP) || defined(PARALLAX)
	#if defined(TANGENT) && defined(BITANGENT) && defined(NORMAL) 
		vTBN = mat3(tangent.xyz, bitangent, normal);
	#elif defined(TANGENT) && defined(NORMAL) 
		vec3 bitangent = cross(normal, tangent.xyz) * ((tangent.w < 0.0) ? -1.0 : 1.0);
		vTBN = mat3(tangent.xyz, bitangent, normal);
	#endif
#endif