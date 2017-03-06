#if defined(BUMP) || defined(PARALLAX)
	#if defined(TANGENT) && defined(BITANGENT) && defined(NORMAL) 
		vTBN = mat3(tangent.xyz, bitangent, normal);
	#endif
#endif