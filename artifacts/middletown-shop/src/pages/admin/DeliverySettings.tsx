import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getDoc, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DeliverySettings() {

  const [loading, setLoading] = useState(false);

  
  const [form, setForm] = useState({
    pickupAddress: "",
    workingHours: "",
    deliveryDuration: "",
    accraFee: "",
    temaFee: "",
    outsideAccraFee: "",

    // NEW
    whatsappNumber: "",
    phoneNumber: "",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const snap = await getDoc(doc(db, "settings", "delivery"));

      if (snap.exists()) {
        setForm({
          pickupAddress: snap.data().pickupAddress || "",
          workingHours: snap.data().workingHours || "",
          deliveryDuration: snap.data().deliveryDuration || "",
          accraFee: snap.data().accraFee?.toString() || "",
          temaFee: snap.data().temaFee?.toString() || "",
          outsideAccraFee: snap.data().outsideAccraFee?.toString() || "",

          // NEW
          whatsappNumber: snap.data().whatsappNumber || "",
          phoneNumber: snap.data().phoneNumber || "",
        });
      }

    } catch (err) {
      console.error(err);
    }
  }

  async function save() {

    setLoading(true);

    try {

      await setDoc(doc(db, "settings", "delivery"), {
        pickupAddress: form.pickupAddress,
        workingHours: form.workingHours,
        deliveryDuration: form.deliveryDuration,
        accraFee: Number(form.accraFee),
        temaFee: Number(form.temaFee),
        outsideAccraFee: Number(form.outsideAccraFee),

        // NEW
        whatsappNumber: form.whatsappNumber,
        phoneNumber: form.phoneNumber,
      });

      toast.success("Delivery settings updated");

    } catch (err) {
      console.error(err);
      toast.error("Failed to save");
    }

    setLoading(false);

  }

  return (
    <div className="max-w-3xl mx-auto">

      <h1 className="text-2xl font-bold mb-6">
        Delivery Settings
      </h1>

      <div className="bg-white rounded-xl border p-6 space-y-5">

        <div>
          <label className="font-medium">
            Pickup Location
          </label>

          <textarea
            rows={3}
            className="w-full border rounded-lg p-3"
            value={form.pickupAddress}
            onChange={(e)=>
              setForm({
                ...form,
                pickupAddress:e.target.value
              })
            }
          />
        </div>

        <div>
          <label className="font-medium">
            Working Hours
          </label>

          <input
            className="w-full border rounded-lg p-3"
            value={form.workingHours}
            onChange={(e)=>
              setForm({
                ...form,
                workingHours:e.target.value
              })
            }
          />
        </div>

        <hr />

        <div>
          <label className="font-medium">Phone Number</label>
          <input
            className="w-full border rounded-lg p-3"
            placeholder="e.g. 024xxxxxxx"
            value={form.phoneNumber}
            onChange={(e) =>
              setForm({ ...form, phoneNumber: e.target.value })
            }
          />
        </div>

        <div>
          <label className="font-medium">WhatsApp Number</label>
          <input
            className="w-full border rounded-lg p-3"
            placeholder="e.g. 024xxxxxxx"
            value={form.whatsappNumber}
            onChange={(e) =>
              setForm({ ...form, whatsappNumber: e.target.value })
            }
          />
        </div>
        
        <div>
          <label className="font-medium">
            Delivery Duration
          </label>

          <input
            className="w-full border rounded-lg p-3"
            placeholder="e.g. Within 1–7 working days"
            value={form.deliveryDuration}
            onChange={(e) =>
              setForm({
                ...form,
                deliveryDuration: e.target.value,
              })
            }
          />
        </div>
        
        <div>
          <label>Accra Delivery Fee</label>

          <input
            type="number"
            className="w-full border rounded-lg p-3"
            value={form.accraFee}
            onChange={(e)=>
              setForm({
                ...form,
                accraFee:e.target.value
              })
            }
          />
        </div>

        <div>
          <label>Tema Delivery Fee</label>

          <input
            type="number"
            className="w-full border rounded-lg p-3"
            value={form.temaFee}
            onChange={(e)=>
              setForm({
                ...form,
                temaFee:e.target.value
              })
            }
          />
        </div>

        <div>
          <label>Outside Accra Delivery Fee</label>

          <input
            type="number"
            className="w-full border rounded-lg p-3"
            value={form.outsideAccraFee}
            onChange={(e)=>
              setForm({
                ...form,
                outsideAccraFee:e.target.value
              })
            }
          />
        </div>

        <button
          onClick={save}
          disabled={loading}
          className="bg-primary text-white px-6 py-3 rounded-lg"
        >
          {loading ? "Saving..." : "Save Settings"}
        </button>

      </div>

    </div>
  );

}