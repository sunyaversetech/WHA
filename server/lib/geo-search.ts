// Distance-based aggregation pipeline for "search near a point" queries
// (GPS / a picked city's coordinates). Deliberately computes the
// great-circle distance from the raw `latitude`/`longitude` fields via
// $expr, the same fields the map-bounds filter already trusts, rather than
// using $geoNear against the `geo` GeoJSON field — $geoNear silently
// excludes any document whose `geo` field isn't populated (only synced on
// `.save()`, so older/directly-written records can lack it even though
// their plain latitude/longitude are fine), which was causing city and GPS
// searches to return incomplete results.
export function buildDistancePipeline(
  refLat: number,
  refLng: number,
  matchFilter: Record<string, any>,
  radiusKm: number | null,
  limit: number,
): any[] {
  return [
    {
      $match: {
        ...matchFilter,
        latitude: { $exists: true, $ne: null },
        longitude: { $exists: true, $ne: null },
      },
    },
    {
      $addFields: {
        distance: {
          $let: {
            vars: {
              lat1: { $degreesToRadians: refLat },
              lon1: { $degreesToRadians: refLng },
              lat2: { $degreesToRadians: { $toDouble: "$latitude" } },
              lon2: { $degreesToRadians: { $toDouble: "$longitude" } },
            },
            in: {
              // Spherical law of cosines, radius 6,371,000m (Earth mean radius).
              // $min guards against floating-point rounding pushing the
              // cosine argument fractionally above 1 for near-identical
              // points, which would otherwise make $acos return null.
              $multiply: [
                6371000,
                {
                  $acos: {
                    $min: [
                      1,
                      {
                        $add: [
                          { $multiply: [{ $sin: "$$lat1" }, { $sin: "$$lat2" }] },
                          {
                            $multiply: [
                              { $cos: "$$lat1" },
                              { $cos: "$$lat2" },
                              { $cos: { $subtract: ["$$lon2", "$$lon1"] } },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    },
    ...(radiusKm ? [{ $match: { distance: { $lte: radiusKm * 1000 } } }] : []),
    { $sort: { distance: 1 } },
    { $limit: limit },
  ];
}
