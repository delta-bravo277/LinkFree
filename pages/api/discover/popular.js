import connectMongo from "../../../config/mongo";
import logger from "../../../config/logger";
import Profile from "../../../models/Profile";
import loadProfiles from "../../../services/profiles/loadProfiles";

export default async function handler(req, res) {
  if (req.method != "GET") {
    return res
      .status(400)
      .json({ error: "Invalid request: GET request required" });
  }

  const { statusCode, data } = await getPopularApi();
  res.status(statusCode).json(data);
}

export async function getPopularApi() {
  await connectMongo();

  let profiles = [];
  try {
    profiles = await Profile.find({
      username: { $nin: process.env.SHADOWBAN.split(",") },
    })
      .sort({ views: -1 })
      .limit(20);
  } catch (e) {
    logger.error(e, "failed to load profiles");
  }

  if (profiles.length === 0) {
    return {
      statusCode: 404,
      data: []
    };
  }

  const profilesWithStats = await loadProfiles(
    profiles.map((profile) =>{
      const data = profile._doc;
      profile._id = profile._id.toString();
      return data;
    })
  );

  const selectedPopularProfiles = profilesWithStats.slice(0, 5);
  return {
    statusCode: 200,
    data: selectedPopularProfiles
  };
}
